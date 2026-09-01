import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { EditEngine, NoteAccess } from './edit-engine'
import { Outcomes } from './outcome'
import { ChatProvider, ChatMessage } from '../providers/types'
import { EditSession } from '../session/edit-session'
import { TFile } from 'obsidian'
import { aTextTurn, aToolCall, aToolTurn, anOpenNote } from '../test-support/builders'
import { FakeEditor } from '../test-support/fake-editor'

describe('EditEngine', () => {
  let editor: FakeEditor
  let session: EditSession
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let engine: EditEngine
  let chat: ChatProvider
  let access: NoteAccess

  beforeEach(() => {
    vi.clearAllMocks()
    editor = new FakeEditor('# Budget\n\nbody')
    session = new EditSession({ path: 'note.md', basename: 'note' } as TFile)
    complete = vi.fn()
    chat = { complete }
    access = { open: () => Outcomes.success(anOpenNote(editor)) }
    engine = new EditEngine(chat, session, access)
  })

  const toolResults = () => session.history.filter((message: ChatMessage) => message.isToolResult())

  describe('when the model responds with text', () => {
    it('returns the text as summary when the model responds without tool calls', async () => {
      complete.mockResolvedValue(Outcomes.success(aTextTurn('Nothing to do')))

      const outcome = await engine.processUtterance('hello')

      expect(outcome).toEqual({ ok: true, value: 'Nothing to do' })
    })
  })

  describe('when the model responds with tool calls', () => {
    it('applies operations in order when a turn has multiple tool calls', async () => {
      complete
        .mockResolvedValueOnce(
          Outcomes.success(
            aToolTurn(
              aToolCall('replace_text', { anchor_text: '# Budget', replacement: '# Costs' }),
              aToolCall('insert_at', { location: 'note_end', content: '\n- item' }),
            ),
          ),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await engine.processUtterance('rename and add')

      expect(editor.content).toBe('# Costs\n\nbody\n- item')
    })

    it('sends the failure reason as tool result when apply returns noMatch', async () => {
      complete
        .mockResolvedValueOnce(
          Outcomes.success(
            aToolTurn(aToolCall('replace_text', { anchor_text: 'missing', replacement: 'x' })),
          ),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await engine.processUtterance('edit')

      expect(toolResults()[0]).toMatchObject({ content: 'anchor not found in note' })
    })

    it('sends invalid-arguments as tool result when args fail validation', async () => {
      complete
        .mockResolvedValueOnce(
          Outcomes.success(aToolTurn(aToolCall('replace_text', { anchor_text: 42 }))),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await engine.processUtterance('edit')

      expect(toolResults()[0]).toMatchObject({
        content: 'invalid arguments: anchor_text and replacement must be strings',
      })
    })

    it('continues the loop when tool results are followed by more tool calls', async () => {
      complete
        .mockResolvedValueOnce(
          Outcomes.success(
            aToolTurn(aToolCall('insert_at', { location: 'note_end', content: 'a' })),
          ),
        )
        .mockResolvedValueOnce(
          Outcomes.success(
            aToolTurn(aToolCall('insert_at', { location: 'note_end', content: 'b' })),
          ),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await engine.processUtterance('edit')

      expect(complete).toHaveBeenCalledTimes(3)
    })

    it('fails with a chat-step outcome when the iteration cap is reached', async () => {
      complete.mockResolvedValue(
        Outcomes.success(aToolTurn(aToolCall('insert_at', { location: 'note_end', content: 'x' }))),
      )

      const outcome = await engine.processUtterance('edit')

      expect(outcome).toEqual({
        ok: false,
        step: 'chat',
        message: 'edit loop exceeded 6 iterations',
      })
    })
  })

  describe('when the vault defines skills', () => {
    const todo = {
      name: 'todo',
      description: 'Archives ticked items.',
      path: '0 - Meta/Skills/todo/SKILL.md',
    }

    const engineWithSkills = (readBody: (skill: unknown) => Promise<string | null>) =>
      new EditEngine(chat, session, access, [todo], readBody as never)

    it('returns the skill body as a tool result when load_skill names a skill', async () => {
      const withSkills = engineWithSkills(async () => '1. Split it.')
      complete
        .mockResolvedValueOnce(
          Outcomes.success(aToolTurn(aToolCall('load_skill', { name: 'todo' }))),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await withSkills.processUtterance('archive my todo')

      expect(toolResults()[0]).toMatchObject({ content: '1. Split it.' })
    })

    it('says so when load_skill names a skill the vault does not define', async () => {
      const withSkills = engineWithSkills(async () => '1. Split it.')
      complete
        .mockResolvedValueOnce(
          Outcomes.success(aToolTurn(aToolCall('load_skill', { name: 'nope' }))),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await withSkills.processUtterance('archive')

      expect(toolResults()[0]).toMatchObject({ content: 'no skill named nope in this vault' })
    })

    it('says so when the skill file cannot be read', async () => {
      const withSkills = engineWithSkills(async () => null)
      complete
        .mockResolvedValueOnce(
          Outcomes.success(aToolTurn(aToolCall('load_skill', { name: 'todo' }))),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await withSkills.processUtterance('archive my todo')

      expect(toolResults()[0]).toMatchObject({ content: 'skill todo could not be read' })
    })
  })

  describe('when utterances overlap', () => {
    it('queues a second utterance when a turn is in flight', async () => {
      const order: string[] = []
      complete.mockImplementation(async (messages: ChatMessage[]) => {
        const lastUser = [...messages].reverse().find((message) => message.isUser())
        order.push(lastUser ? lastUser.content : '')
        return Outcomes.success(aTextTurn('ok'))
      })

      await Promise.all([engine.processUtterance('first'), engine.processUtterance('second')])

      expect(order).toEqual(['first', 'second'])
    })

    it('re-reads note content when a new turn starts', async () => {
      complete.mockResolvedValue(Outcomes.success(aTextTurn('ok')))
      await engine.processUtterance('first')
      editor.content = 'changed externally'

      await engine.processUtterance('second')

      const lastSystem = complete.mock.calls[1][0][0]
      expect(lastSystem.content).toContain('changed externally')
    })
  })
})
