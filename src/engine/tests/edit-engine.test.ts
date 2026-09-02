import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { EditEngine } from '../edit-engine'
import { Outcomes } from '../../shared/models/outcome'
import { SkillRepository } from '../../skills/skill-repository'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { ChatProvider, ChatMessage } from '../../providers/types'
import { aSession, aTextTurn, aToolCall, aToolTurn, anEngine } from '../../test-support/builders'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { SessionRepository } from '../../session/session-repository'

describe('EditEngine', () => {
  let editor: FakeEditor
  let sessions: SessionRepository
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let engine: EditEngine
  let chat: ChatProvider
  let noteLocator: FakeNoteLocator

  beforeEach(() => {
    vi.clearAllMocks()
    editor = new FakeEditor('# Budget\n\nbody')
    sessions = aSession()
    complete = vi.fn()
    chat = { complete }
    noteLocator = new FakeNoteLocator().withOpenNote('note.md', editor)
    engine = anEngine(chat, {
      sessions,
      noteLocator,
      agentsMdRepository: noInstructions(),
    })
  })

  const noInstructions = () => new AgentsMdRepository(new FakeAdapter().asAdapter())

  const toolResults = () =>
    sessions.chatHistory().filter((message: ChatMessage) => message.isToolResult())

  describe('when the model responds with text', () => {
    it('returns the text as summary when the model responds without tool calls', async () => {
      complete.mockResolvedValue(Outcomes.success(aTextTurn('Nothing to do')))

      const outcome = await engine.processUtterance('hello')

      expect(outcome).toEqual(Outcomes.success('Nothing to do'))
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

    it('focuses the last edit when the turn concludes', async () => {
      complete
        .mockResolvedValueOnce(
          Outcomes.success(
            aToolTurn(
              aToolCall('replace_text', { anchor_text: '# Budget', replacement: '# Costs' }),
            ),
          ),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await engine.processUtterance('rename it')

      expect(editor.scrolledTo).toEqual({ line: 0, ch: 7 })
    })

    it('leaves the note unscrolled when the turn fails at the iteration cap', async () => {
      complete.mockResolvedValue(
        Outcomes.success(aToolTurn(aToolCall('insert_at', { location: 'note_end', content: 'x' }))),
      )

      await engine.processUtterance('edit')

      expect(editor.scrolledTo).toBeNull()
    })

    it('fails with a chat-step outcome when the iteration cap is reached', async () => {
      complete.mockResolvedValue(
        Outcomes.success(aToolTurn(aToolCall('insert_at', { location: 'note_end', content: 'x' }))),
      )

      const outcome = await engine.processUtterance('edit')

      expect(outcome).toEqual(Outcomes.failure('chat', 'edit loop exceeded 10 iterations'))
    })
  })

  describe('when the vault defines skills', () => {
    const SKILLS_PATH = '0 - Meta/Skills'
    const todoSource = '---\nname: todo\ndescription: Archives ticked items.\n---\n\n1. Split it.'

    const engineReading = (adapter: FakeAdapter) =>
      anEngine(chat, {
        sessions,
        noteLocator,
        agentsMdRepository: noInstructions(),
        skillRepository: new SkillRepository(adapter.asAdapter(), SKILLS_PATH),
      })

    const engineWithTodoSkill = () =>
      engineReading(new FakeAdapter().withSkill(`${SKILLS_PATH}/todo`, todoSource))

    it('returns the skill body as a tool result when load_skill names a skill', async () => {
      const withSkills = engineWithTodoSkill()
      complete
        .mockResolvedValueOnce(
          Outcomes.success(aToolTurn(aToolCall('load_skill', { name: 'todo' }))),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await withSkills.processUtterance('archive my todo')

      expect(toolResults()[0].content).toContain('1. Split it.')
    })

    it('says so when load_skill names a skill the vault does not define', async () => {
      const withSkills = engineWithTodoSkill()
      complete
        .mockResolvedValueOnce(
          Outcomes.success(aToolTurn(aToolCall('load_skill', { name: 'nope' }))),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await withSkills.processUtterance('archive')

      expect(toolResults()[0]).toMatchObject({ content: 'no skill named nope in this vault' })
    })

    it('says so when the skill file cannot be read', async () => {
      const withSkills = engineReading(
        new FakeAdapter().withSkillDeletedAfterListing(`${SKILLS_PATH}/todo`, todoSource),
      )
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

    it('sends the note after the conversation history when a turn starts', async () => {
      complete.mockResolvedValue(Outcomes.success(aTextTurn('ok')))
      await engine.processUtterance('first')

      await engine.processUtterance('second')

      const sent = complete.mock.calls[1][0]
      expect(sent[sent.length - 1].content).toContain('Note content:')
    })

    it('re-reads note content when a new turn starts', async () => {
      complete.mockResolvedValue(Outcomes.success(aTextTurn('ok')))
      await engine.processUtterance('first')
      editor.content = 'changed externally'

      await engine.processUtterance('second')

      const sent = complete.mock.calls[1][0]
      expect(sent[sent.length - 1].content).toContain('changed externally')
    })
  })
})
