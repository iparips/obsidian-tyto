import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { EditEngine } from '../edit-engine'
import { Outcomes } from '../../shared/models/outcome'
import { SkillRepository } from '../../skills/skill-repository'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { ChatProvider, ChatMessage } from '../../model/providers/types'
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
    // The second anchor was computed against the note the first call changed,
    // which is what duplicated the reported user's content.
    it('applies the first edit only when a turn batches two of them', async () => {
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

      expect(editor.content).toBe('# Costs\n\nbody')
    })

    it('names the step boundary when a turn batches two edits', async () => {
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

      expect(toolResults()[1].content).toContain('One edit per step')
    })

    it('applies an edit that follows a search call, since only edits count', async () => {
      complete
        .mockResolvedValueOnce(
          Outcomes.success(
            aToolTurn(
              aToolCall('glob_notes', { pattern: '*.md' }),
              aToolCall('replace_text', { anchor_text: '# Budget', replacement: '# Costs' }),
            ),
          ),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await engine.processUtterance('find and rename')

      expect(editor.content).toBe('# Costs\n\nbody')
    })

    it('applies an edit in the next step, since the count is per step', async () => {
      complete
        .mockResolvedValueOnce(
          Outcomes.success(
            aToolTurn(aToolCall('replace_text', { anchor_text: '# Budget', replacement: '# Costs' })),
          ),
        )
        .mockResolvedValueOnce(
          Outcomes.success(
            aToolTurn(aToolCall('insert_at', { location: 'note_end', content: '\n- item' })),
          ),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      await engine.processUtterance('rename then add')

      expect(editor.content).toBe('# Costs\n\nbody\n- item')
    })

    // RepeatedRefusalCounter ends a turn after two identical refusals, so a
    // boundary refusal recorded against it would make a three-edit batch stick.
    it('keeps the turn going when a batch of three edits refuses twice', async () => {
      complete
        .mockResolvedValueOnce(
          Outcomes.success(
            aToolTurn(
              aToolCall('replace_text', { anchor_text: '# Budget', replacement: '# Costs' }),
              aToolCall('insert_at', { location: 'note_end', content: '\n- one' }),
              aToolCall('insert_at', { location: 'note_end', content: '\n- two' }),
            ),
          ),
        )
        .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))

      const outcome = await engine.processUtterance('three edits')

      expect(outcome).toEqual(Outcomes.success('done'))
    })

    // The bare string applied carried no tense and no target, so a batch gave
    // the model two identical results and it read one as an earlier edit.
    describe('when an edit applies', () => {
      const renames = () =>
        aToolTurn(aToolCall('replace_text', { anchor_text: '# Budget', replacement: '# Costs' }))

      const resultOfRename = async () => {
        complete
          .mockResolvedValueOnce(Outcomes.success(renames()))
          .mockResolvedValueOnce(Outcomes.success(aTextTurn('done')))
        await engine.processUtterance('rename it')
        return toolResults()[0].content
      }

      it('names the operation that applied', async () => {
        expect(await resultOfRename()).toContain('replace_text')
      })

      it('names the note the edit reached', async () => {
        expect(await resultOfRename()).toContain('note.md')
      })

      it('names the line the edit ended on, so a batch is told apart', async () => {
        expect(await resultOfRename()).toContain('line 1')
      })

      // The model sent the text one message earlier, and a dictated paragraph
      // makes echoing it back unbounded.
      it('does not echo the content it wrote', async () => {
        expect(await resultOfRename()).not.toContain('# Costs')
      })
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

      expect(warnings).toEqual(['Tyto is taking longer than usual: 3 steps left this turn.'])
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

  // A turn bound to a file with no editor fails before the loop runs. The
  // utterance was once appended inside that loop, so a failed turn left nothing
  // in the history and a following "retry" retried the instruction before it.
  describe('when the turn cannot open', () => {
    it('records the utterance when the turn fails to open, so a retry has it', async () => {
      const stranded = anEngine(chat, {
        sessions,
        noteLocator: new FakeNoteLocator(),
        agentsMdRepository: noInstructions(),
      })

      await stranded.processUtterance('add ilya under the heading')

      expect(sessions.chatHistory().at(-1)).toMatchObject({
        content: 'add ilya under the heading',
      })
    })

    it('still reports the failure when the turn cannot open', async () => {
      const stranded = anEngine(chat, {
        sessions,
        noteLocator: new FakeNoteLocator(),
        agentsMdRepository: noInstructions(),
      })

      const outcome = await stranded.processUtterance('add ilya under the heading')

      expect(outcome.hasFailed()).toBe(true)
    })
  })

  // The release 3 guarantee: a vault defining none is offered schemas carrying
  // no applicable_skills, so its calls must never be refused for omitting one.
  describe('when the vault defines no skills', () => {
    it('applies an edit declaring no applicable skills', async () => {
      complete
        .mockResolvedValueOnce(
          Outcomes.success(
            aToolTurn(aToolCall('insert_at', { location: 'note_start', content: 'hi\n' })),
          ),
        )
        .mockResolvedValue(Outcomes.success(aTextTurn('done')))

      await engine.processUtterance('add a line')

      expect(editor.content).toBe('hi\n# Budget\n\nbody')
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

    // The model's own judgement, held to itself: the harness never decides
    // which skill fits, only that the names the model declared are names it
    // has read.
    describe('when the model declares the skills covering an edit', () => {
      const edits = (applicable_skills?: string[]) =>
        aToolTurn(
          aToolCall('insert_at', {
            location: 'note_start',
            content: 'hi\n',
            ...(applicable_skills ? { applicable_skills } : {}),
          }),
        )

      const resultOf = (callIndex: number) =>
        complete.mock.calls[callIndex][0].filter((m: ChatMessage) => m.isToolResult()).at(-1)

      it('refuses the edit when it declares a skill nothing has read', async () => {
        complete
          .mockResolvedValueOnce(Outcomes.success(edits(['todo'])))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await engineWithTodoSkill().processUtterance('add a line')

        expect(editor.content).toBe('# Budget\n\nbody')
      })

      // The refusal names what to load: one that only reports the block is one
      // the model answers by retrying the same call.
      it('names the skill to load when it declares one nothing has read', async () => {
        complete
          .mockResolvedValueOnce(Outcomes.success(edits(['todo'])))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await engineWithTodoSkill().processUtterance('add a line')

        expect(resultOf(1)).toMatchObject({
          content:
            'call load_skill for todo now, then call this again declaring it. Do not retry this call first',
        })
      })

      it('applies the edit when it declares a skill loaded this turn', async () => {
        complete
          .mockResolvedValueOnce(
            Outcomes.success(aToolTurn(aToolCall('load_skill', { name: 'todo' }))),
          )
          .mockResolvedValueOnce(Outcomes.success(edits(['todo'])))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await engineWithTodoSkill().processUtterance('add a line')

        expect(editor.content).toBe('hi\n# Budget\n\nbody')
      })

      // The reported session: a second utterance was refused for not checking a
      // skill whose body was still in the chat history, and the turn died
      // retrying the edit.
      it('applies the edit on its first call when the skill was read in an earlier turn', async () => {
        const withSkills = engineWithTodoSkill()
        complete
          .mockResolvedValueOnce(
            Outcomes.success(aToolTurn(aToolCall('load_skill', { name: 'todo' }))),
          )
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))
        await withSkills.processUtterance('archive my todo')
        complete.mockReset()
        complete
          .mockResolvedValueOnce(Outcomes.success(edits(['todo'])))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await withSkills.processUtterance('add a line under it')

        expect(editor.content).toBe('hi\n# Budget\n\nbody')
      })

      // Reading one skill does not license writing under another: the gate asks
      // which skill, not merely whether any was read.
      it('refuses a skill unread even when a different one was read earlier', async () => {
        const adapter = new FakeAdapter()
          .withSkill(`${SKILLS_PATH}/todo`, todoSource)
          .withSkill(
            `${SKILLS_PATH}/shopping`,
            '---\nname: shopping\ndescription: Keeps the list.\n---\n\n1. Add it.',
          )
        const withSkills = engineReading(adapter)
        complete
          .mockResolvedValueOnce(
            Outcomes.success(aToolTurn(aToolCall('load_skill', { name: 'todo' }))),
          )
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))
        await withSkills.processUtterance('archive my todo')
        complete.mockReset()
        complete
          .mockResolvedValueOnce(Outcomes.success(edits(['shopping'])))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await withSkills.processUtterance('add milk')

        expect(resultOf(1)).toMatchObject({
          content:
            'call load_skill for shopping now, then call this again declaring it. Do not retry this call first',
        })
      })

      it('applies the edit when it declares that no skill covers the utterance', async () => {
        complete
          .mockResolvedValueOnce(Outcomes.success(edits([])))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await engineWithTodoSkill().processUtterance('add a line')

        expect(editor.content).toBe('hi\n# Budget\n\nbody')
      })

      // A name the model invented is answered with the real ones, so it does not
      // search for the list it was already sent.
      it('lists the vault skills when it declares a name none carries', async () => {
        complete
          .mockResolvedValueOnce(Outcomes.success(edits(['gardening'])))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await engineWithTodoSkill().processUtterance('add a line')

        expect(resultOf(1)).toMatchObject({
          content: 'no skill in this vault is named gardening; this vault defines todo',
        })
      })

      // An omitted argument and a declared [] both read as an empty array, and
      // they are different claims: one says no skill covers this, the other says
      // nothing at all.
      it('refuses the edit when it sends no applicable_skills at all', async () => {
        complete
          .mockResolvedValueOnce(Outcomes.success(edits()))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await engineWithTodoSkill().processUtterance('add a line')

        expect(resultOf(1)).toMatchObject({
          content:
            'this vault defines skills, so every call that reaches it must send applicable_skills: the names covering this utterance, or [] when none does',
        })
      })
    })

    // A turn globbed a week folder before loading the skill that held the
    // vault's filename format, and was only refused four steps later at the
    // edit. The gate holds at the search too, since a skill knows where its
    // notes live.
    describe('when the model declares the skills covering a search', () => {
      const globs = (applicable_skills?: string[]) =>
        aToolTurn(
          aToolCall('glob_notes', {
            pattern: '**/*.md',
            ...(applicable_skills ? { applicable_skills } : {}),
          }),
        )

      const resultOf = (callIndex: number) =>
        complete.mock.calls[callIndex][0].filter((m: ChatMessage) => m.isToolResult()).at(-1)

      it('refuses the search when it declares a skill nothing has read', async () => {
        complete
          .mockResolvedValueOnce(Outcomes.success(globs(['todo'])))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await engineWithTodoSkill().processUtterance('find my note')

        expect(resultOf(1)).toMatchObject({
          content:
            'call load_skill for todo now, then call this again declaring it. Do not retry this call first',
        })
      })

      // This vault has search off, so the call reaching that refusal is what
      // shows it passed the skill gate rather than stopping at it.
      it('lets the search past the gate once the declared skill is read', async () => {
        complete
          .mockResolvedValueOnce(
            Outcomes.success(aToolTurn(aToolCall('load_skill', { name: 'todo' }))),
          )
          .mockResolvedValueOnce(Outcomes.success(globs(['todo'])))
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await engineWithTodoSkill().processUtterance('find my note')

        expect(resultOf(2)).toMatchObject({
          content: 'searching the vault is turned off in settings',
        })
      })

      // Resolving reaches no vault, and the phrase it reads is what tells the
      // model which skill the turn needs: gating it would ask the question blind.
      it('resolves a date without declaring any skill', async () => {
        complete
          .mockResolvedValueOnce(
            Outcomes.success(aToolTurn(aToolCall('resolve_date', { phrase: 'last Friday' }))),
          )
          .mockResolvedValue(Outcomes.success(aTextTurn('done')))

        await engineWithTodoSkill().processUtterance('find last Fridays note')

        expect(resultOf(1)).not.toMatchObject({
          content: expect.stringContaining('applicable_skills'),
        })
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

    // Two messages rather than one, so the note stays the last thing read and
    // the date it must not take from a note name sits directly before it.
    it('sends the date directly before the note when a turn starts', async () => {
      complete.mockResolvedValue(Outcomes.success(aTextTurn('ok')))

      await engine.processUtterance('first')

      const sent = complete.mock.calls[0][0]
      expect(sent[sent.length - 2].content).toContain('Today is')
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
