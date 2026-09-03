import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { EditEngine } from '../edit-engine'
import { Outcomes } from '../../shared/models/outcome'
import { SkillRepository } from '../../skills/skill-repository'
import { TurnProgressPublisher } from '../turn-progress-publisher'
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

      expect(outcome.hasFailed() && outcome.step).toBe('chat')
    })

    it('names the cap it hit when the iteration cap is reached', async () => {
      complete.mockResolvedValue(
        Outcomes.success(aToolTurn(aToolCall('insert_at', { location: 'note_end', content: 'x' }))),
      )

      const outcome = await engine.processUtterance('edit')

      expect(outcome.hasFailed() && outcome.message).toContain('ran out of steps for this turn')
    })

    it('warns through the panel before the iteration cap is reached', async () => {
      const warnings: string[] = []
      const warned = anEngine(chat, {
        sessions,
        noteLocator,
        agentsMdRepository: noInstructions(),
        progress: new TurnProgressPublisher(
          () => undefined,
          () => undefined,
          () => undefined,
          () => undefined,
          (text) => warnings.push(text),
        ),
      })
      complete.mockResolvedValue(
        Outcomes.success(aToolTurn(aToolCall('insert_at', { location: 'note_end', content: 'x' }))),
      )

      await warned.processUtterance('edit')

      expect(warnings).toEqual(['Owl is taking longer than usual: 3 steps left this turn.'])
    })

    it('warns nothing when the turn finishes with room to spare', async () => {
      const warnings: string[] = []
      const warned = anEngine(chat, {
        sessions,
        noteLocator,
        agentsMdRepository: noInstructions(),
        progress: new TurnProgressPublisher(
          () => undefined,
          () => undefined,
          () => undefined,
          () => undefined,
          (text) => warnings.push(text),
        ),
      })
      complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))

      await warned.processUtterance('edit')

      expect(warnings).toEqual([])
    })

    it('suggests a way forward when the iteration cap is reached', async () => {
      complete.mockResolvedValue(
        Outcomes.success(aToolTurn(aToolCall('insert_at', { location: 'note_end', content: 'x' }))),
      )

      const outcome = await engine.processUtterance('edit')

      expect(outcome.hasFailed() && outcome.message).toContain('Try a smaller instruction')
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

    // Ordering, not relevance: the harness never decides which skill applies. It
    // refuses the first edit until the model has said which one does, or that
    // none does. Both answers are the model's own.
    describe('when the model edits before checking the skills', () => {
      const edits = () =>
        aToolTurn(aToolCall('insert_at', { location: 'note_start', content: 'hi\n' }))

      it('refuses the edit until the model has checked the skills', async () => {
        complete
          .mockResolvedValueOnce(Outcomes.success(edits()))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await engineWithTodoSkill().processUtterance('add a line')

        expect(editor.content).toBe('# Budget\n\nbody')
      })

      it('names both ways to answer, so the model is never stuck', async () => {
        complete
          .mockResolvedValueOnce(Outcomes.success(edits()))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await engineWithTodoSkill().processUtterance('add a line')

        const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
        expect(results.at(-1)).toMatchObject({
          content:
            'this vault defines skills and you have not checked them; call load_skill for the one that covers this, or no_skill_applies if none does, then edit',
        })
      })

      it('applies the edit once a skill has been loaded', async () => {
        complete
          .mockResolvedValueOnce(
            Outcomes.success(aToolTurn(aToolCall('load_skill', { name: 'todo' }))),
          )
          .mockResolvedValueOnce(Outcomes.success(edits()))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await engineWithTodoSkill().processUtterance('add a line')

        expect(editor.content).toBe('hi\n# Budget\n\nbody')
      })

      it('shows the reason in the steps list when the model says no skill applies', async () => {
        const steps: string[] = []
        const withSteps = anEngine(chat, {
          sessions,
          noteLocator,
          agentsMdRepository: noInstructions(),
          skillRepository: new SkillRepository(
            new FakeAdapter().withSkill(`${SKILLS_PATH}/todo`, todoSource).asAdapter(),
            SKILLS_PATH,
          ),
          progress: new TurnProgressPublisher(
            () => undefined,
            () => undefined,
            () => undefined,
            () => undefined,
            () => undefined,
            (step) => steps.push(`${step.label}: ${step.detail}`),
          ),
        })
        complete
          .mockResolvedValueOnce(
            Outcomes.success(
              aToolTurn(aToolCall('no_skill_applies', { reason: 'plain dictation' })),
            ),
          )
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await withSteps.processUtterance('add a line')

        expect(steps).toContain('No skill applies: plain dictation')
      })

      it('applies the edit once the model says no skill applies', async () => {
        complete
          .mockResolvedValueOnce(
            Outcomes.success(
              aToolTurn(aToolCall('no_skill_applies', { reason: 'plain dictation' })),
            ),
          )
          .mockResolvedValueOnce(Outcomes.success(edits()))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await engineWithTodoSkill().processUtterance('add a line')

        expect(editor.content).toBe('hi\n# Budget\n\nbody')
      })

      it('refuses only once, so a turn is not blocked twice on one question', async () => {
        complete
          .mockResolvedValueOnce(Outcomes.success(edits()))
          .mockResolvedValueOnce(
            Outcomes.success(aToolTurn(aToolCall('no_skill_applies', { reason: 'none' }))),
          )
          .mockResolvedValueOnce(Outcomes.success(edits()))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await engineWithTodoSkill().processUtterance('add a line')

        expect(editor.content).toBe('hi\n# Budget\n\nbody')
      })
    })

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

    it('publishes a panel entry naming the skill when one is loaded', async () => {
      const loaded: string[] = []
      const withSkills = anEngine(chat, {
        sessions,
        noteLocator,
        agentsMdRepository: noInstructions(),
        skillRepository: new SkillRepository(
          new FakeAdapter().withSkill(`${SKILLS_PATH}/todo`, todoSource).asAdapter(),
          SKILLS_PATH,
        ),
        progress: new TurnProgressPublisher(
          () => undefined,
          () => undefined,
          () => undefined,
          (name) => loaded.push(name),
        ),
      })
      complete
        .mockResolvedValueOnce(
          Outcomes.success(aToolTurn(aToolCall('load_skill', { name: 'todo' }))),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await withSkills.processUtterance('archive my todo')

      expect(loaded).toEqual(['todo'])
    })

    it('publishes nothing when load_skill names a skill the vault lacks', async () => {
      const loaded: string[] = []
      const withSkills = anEngine(chat, {
        sessions,
        noteLocator,
        agentsMdRepository: noInstructions(),
        skillRepository: new SkillRepository(
          new FakeAdapter().withSkill(`${SKILLS_PATH}/todo`, todoSource).asAdapter(),
          SKILLS_PATH,
        ),
        progress: new TurnProgressPublisher(
          () => undefined,
          () => undefined,
          () => undefined,
          (name) => loaded.push(name),
        ),
      })
      complete
        .mockResolvedValueOnce(
          Outcomes.success(aToolTurn(aToolCall('load_skill', { name: 'nope' }))),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await withSkills.processUtterance('archive')

      expect(loaded).toEqual([])
    })

    it('publishes nothing when the skill file cannot be read', async () => {
      const loaded: string[] = []
      const withSkills = anEngine(chat, {
        sessions,
        noteLocator,
        agentsMdRepository: noInstructions(),
        skillRepository: new SkillRepository(
          new FakeAdapter()
            .withSkillDeletedAfterListing(`${SKILLS_PATH}/todo`, todoSource)
            .asAdapter(),
          SKILLS_PATH,
        ),
        progress: new TurnProgressPublisher(
          () => undefined,
          () => undefined,
          () => undefined,
          (name) => loaded.push(name),
        ),
      })
      complete
        .mockResolvedValueOnce(
          Outcomes.success(aToolTurn(aToolCall('load_skill', { name: 'todo' }))),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await withSkills.processUtterance('archive my todo')

      expect(loaded).toEqual([])
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
