import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { App } from 'obsidian'
import { SessionRepository } from '../../session/session-repository'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { HarnessToolsService } from '../tools/harness-tools-service'
import { Outcomes } from '../../shared/models/outcome'
import { ChatMessage, ChatProvider } from '../../model/providers/types'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { AllowList } from '../../commands/allow-list'
import { ObsidianCommandCatalogue } from '../../commands/obsidian-command-catalogue'
import { ObsidianCommandRegistry } from '../../commands/obsidian-command-registry'
import { ObsidianCommandRunner } from '../../commands/obsidian-command-runner'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { ToolNoteOpening } from '../../session/tool-note-opening'
import { NoteGlob } from '../../search/note-glob'
import { NoteGrep } from '../../search/note-grep'
import { TagReader } from '../../search/tag-reader'
import { SearchToolsService } from '../tools/search-tools-service'
import { DateToolService } from '../tools/date-tool-service'
import { NoteReader } from '../../search/note-reader'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeVault } from '../../test-support/fake-vault'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'
import { FakeWorkspace } from '../../test-support/fake-workspace'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import {
  aSession,
  aTextTurn,
  aToolCall,
  aToolTurn,
  anEngine,
  stepTextOf,
} from '../../test-support/builders'
import { EditEngine } from '../edit-engine'

const DAILY = 'Journal/2026-09-02.md'
const SHOPPING = 'Lists/shopping.md'

// The sequence the provider rejects: a tool result must follow the assistant
// message that called it, so anything appended between the two ends the turn.
const systemMessagesSplittingToolPairsIn = (sent: readonly ChatMessage[]): string[] =>
  sent
    .filter(
      (message, at) =>
        message.isSystem() && !!sent[at - 1]?.hasToolCalls() && !!sent[at + 1]?.isToolResult(),
    )
    .map((message) => message.content)

describe('EditEngine', () => {
  let editor: FakeEditor
  let dailyEditor: FakeEditor
  let shoppingEditor: FakeEditor
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let registry: FakeCommandRegistry
  let workspace: FakeWorkspace
  let vault: FakeVault
  let instructionVault: FakeVault
  let noteLocator: FakeNoteLocator
  let sessions: SessionRepository
  let steps: string[]
  let answers: { text: string; sources: string[] }[]
  let retargets: { path: string | null; byUser: boolean }[]
  let toolNoteOpening: ToolNoteOpening

  beforeEach(() => {
    vi.clearAllMocks()
    editor = new FakeEditor('# Budget\n\nbody')
    dailyEditor = new FakeEditor('# Today\n\n## Meetings\n')
    shoppingEditor = new FakeEditor('# Shopping\n\n- milk\n')
    complete = vi.fn()
    registry = new FakeCommandRegistry()
      .withCommand('daily-notes:goto-today', 'Open today')
      .withCommand('daily-notes:goto-shopping', 'Open shopping')
    workspace = new FakeWorkspace('note.md')
    vault = new FakeVault()
    instructionVault = new FakeVault()
    steps = []
    answers = []
    retargets = []
    toolNoteOpening = new ToolNoteOpening()
    sessions = aSession()
    noteLocator = new FakeNoteLocator()
      .withOpenNote('note.md', editor)
      .withOpenNote(DAILY, dailyEditor)
      .withOpenNote(SHOPPING, shoppingEditor)
  })

  const opensDailyNote = () => {
    registry.executeCommandById = (id: string) => {
      registry.executed.push(id)
      workspace.finishesOpening(DAILY)
      return true
    }
  }

  // A note per command, so a batch of two commands moves the target twice where
  // the single-note helper would move it once and then find it already there.
  const opensANotePerCommand = (notesByCommandId: Record<string, string>) => {
    registry.executeCommandById = (id: string) => {
      registry.executed.push(id)
      workspace.finishesOpening(notesByCommandId[id])
      return true
    }
  }

  const appOf = (): App =>
    ({ ...registry.asApp(), workspace: workspace.asWorkspace() }) as unknown as App

  const harnessOf = (allowed: string[], searchEnabled: boolean): HarnessToolsService => {
    const app = appOf()
    const commandRegistry = new ObsidianCommandRegistry(app)
    const catalogue = new ObsidianCommandCatalogue(commandRegistry, new AllowList(allowed))
    return new HarnessToolsService(
      new ObsidianCommandRunner(
        app,
        catalogue,
        new OpenedNoteWait(app, 30, toolNoteOpening),
        commandRegistry,
      ),
      new NoteReader(vault.asVault()),
      catalogue,
      searchEnabled,
      new SearchToolsService(
        new NoteGlob(vault.asVault()),
        new NoteGrep(vault.asVault()),
        new TagReader(vault.asVault(), vault.asMetadataCache()),
      ),
      new DateToolService(),
    )
  }

  const engineOf = (allowed: string[] = ['daily-notes:*'], searchEnabled = true) =>
    anEngine(
      { complete },
      {
        sessions,
        noteLocator,
        vault,
        agentsMdRepository: new AgentsMdRepository(instructionVault.asVault()),
        harnessToolsService: harnessOf(allowed, searchEnabled),
        toolNoteOpening,
        progress: new TurnProgressPublisher(
          (text, sources) => answers.push({ text, sources }),
          (path, byUser) => retargets.push({ path, byUser }),
          () => undefined,
          (name) => steps.push(`Loaded skill: ${name}`),
          () => undefined,
          (step) => steps.push(stepTextOf(step)),
        ),
      },
    )

  const respondsWith = (...turns: ReturnType<typeof aToolTurn>[]) => {
    turns.forEach((turn) => complete.mockResolvedValueOnce(Outcomes.success(turn)))
    complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))
  }

  const runCommand = () =>
    aToolTurn(aToolCall('run_command', { command_id: 'daily-notes:goto-today' }))

  const commandOpening = (commandId: string) => aToolCall('run_command', { command_id: commandId })

  describe('when a command opens a note', () => {
    beforeEach(() => {
      opensDailyNote()
    })

    // The runner awaits the open, so Obsidian fires file-open and the session
    // binds before the command returns. Publishing again there said the note
    // changed twice for one open.
    it('reports the move once when file-open fires before the command returns', async () => {
      const engine = engineOf()
      registry.executeCommandById = (id: string) => {
        registry.executed.push(id)
        workspace.finishesOpening(DAILY)
        void engine.followActiveNote(DAILY)
        return true
      }
      respondsWith(runCommand())

      await engine.processUtterance('open my daily note')

      expect(retargets).toEqual([{ path: DAILY, byUser: false }])
    })

    it('applies the following edit to the opened note when a command retargets', async () => {
      respondsWith(
        runCommand(),
        aToolTurn(
          aToolCall('insert_text', {
            anchor_text: '## Meetings',
            position: 'after',
            content: '\nstandup notes',
          }),
        ),
      )

      await engineOf().processUtterance('open my daily note and add a paragraph')

      expect(dailyEditor.content).toBe('# Today\n\n## Meetings\nstandup notes\n')
    })

    it('leaves the original note untouched when a command retargets', async () => {
      respondsWith(
        runCommand(),
        aToolTurn(aToolCall('insert_at', { location: 'note_end', content: 'x' })),
      )

      await engineOf().processUtterance('open my daily note and add a paragraph')

      expect(editor.content).toBe('# Budget\n\nbody')
    })

    it('reports the command to the panel naming the new note when a command retargets', async () => {
      respondsWith(runCommand())

      await engineOf().processUtterance('open my daily note')

      expect(steps).toContain(`Ran command: Open today — now editing ${DAILY}`)
    })

    // The command entry once landed after the steps block, so a command that
    // ran before an edit read as though it came after.
    it('numbers the command before the edit that followed it', async () => {
      respondsWith(
        runCommand(),
        aToolTurn(aToolCall('insert_at', { location: 'note_end', content: 'x' })),
      )

      await engineOf().processUtterance('open my daily note and add a line')

      expect(steps.map((step) => step.split(':')[0])).toEqual(['Ran command', 'Edit'])
    })
  })

  describe('when a command opens no note', () => {
    it('leaves the edit on the original note when nothing opened', async () => {
      respondsWith(
        runCommand(),
        aToolTurn(aToolCall('insert_at', { location: 'note_end', content: '\nx' })),
      )

      await engineOf().processUtterance('run the command then edit')

      expect(editor.content).toBe('# Budget\n\nbody\nx')
    })

    it('says the binding stayed when nothing opened', async () => {
      respondsWith(runCommand())

      await engineOf().processUtterance('run the command')

      expect(steps).toContain('Ran command: Open today')
    })
  })

  // A step reads its note once, so a second note opened inside that step leaves
  // every following call anchored to a note the model was never shown.
  describe('when a step moves the target', () => {
    const editsTheTarget = () => aToolCall('insert_at', { location: 'note_end', content: '\nx' })

    describe('when a batch runs two commands, each opening a note', () => {
      beforeEach(() => {
        opensANotePerCommand({
          'daily-notes:goto-today': DAILY,
          'daily-notes:goto-shopping': SHOPPING,
        })
      })

      it('leaves the target on the note the first command opened', async () => {
        respondsWith(
          aToolTurn(
            commandOpening('daily-notes:goto-today'),
            commandOpening('daily-notes:goto-shopping'),
          ),
        )

        await engineOf().processUtterance('open my daily note and my shopping list')

        expect(sessions.targetNote()).toBe(DAILY)
      })

      it('never runs the second command, so the second note is never opened', async () => {
        respondsWith(
          aToolTurn(
            commandOpening('daily-notes:goto-today'),
            commandOpening('daily-notes:goto-shopping'),
          ),
        )

        await engineOf().processUtterance('open my daily note and my shopping list')

        expect(registry.executed).toEqual(['daily-notes:goto-today'])
      })

      it('names both notes in the refusal the model reads', async () => {
        respondsWith(
          aToolTurn(
            commandOpening('daily-notes:goto-today'),
            commandOpening('daily-notes:goto-shopping'),
          ),
        )

        await engineOf().processUtterance('open my daily note and my shopping list')

        const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
        expect(results[1].content).toBe(
          `One note per step. Running that opened ${DAILY}, and the note this step ` +
            'was read against was note.md, so this call would act on a note you ' +
            `have not been shown. Send it on the next step, which reads ${DAILY} first.`,
        )
      })

      it('publishes a refused line for the second command', async () => {
        respondsWith(
          aToolTurn(
            commandOpening('daily-notes:goto-today'),
            commandOpening('daily-notes:goto-shopping'),
          ),
        )

        await engineOf().processUtterance('open my daily note and my shopping list')

        expect(steps.filter((step) => step.startsWith('Refused'))).toEqual([
          expect.stringContaining('One note per step'),
        ])
      })

      it('keeps the turn going rather than ending it stuck', async () => {
        respondsWith(
          aToolTurn(
            commandOpening('daily-notes:goto-today'),
            commandOpening('daily-notes:goto-shopping'),
          ),
        )

        const outcome = await engineOf().processUtterance('open both notes')

        expect(outcome.outcome).toEqual(Outcomes.success('done'))
      })
    })

    // Neither refusal reaches RepeatedRefusalCounter, which would otherwise end
    // the turn on the second identical one.
    describe('when a batch runs three commands, each opening a note', () => {
      beforeEach(() => {
        opensANotePerCommand({
          'daily-notes:goto-today': DAILY,
          'daily-notes:goto-shopping': SHOPPING,
          'daily-notes:goto-archive': 'Lists/archive.md',
        })
        registry.withCommand('daily-notes:goto-archive', 'Open archive')
        noteLocator.withOpenNote('Lists/archive.md', new FakeEditor('# Archive\n'))
      })

      it('runs the first alone, so the second and third are both refused', async () => {
        respondsWith(
          aToolTurn(
            commandOpening('daily-notes:goto-today'),
            commandOpening('daily-notes:goto-shopping'),
            commandOpening('daily-notes:goto-archive'),
          ),
        )

        await engineOf().processUtterance('open all three')

        expect(registry.executed).toEqual(['daily-notes:goto-today'])
      })

      it('keeps the turn going, since neither refusal is recorded as repeated', async () => {
        respondsWith(
          aToolTurn(
            commandOpening('daily-notes:goto-today'),
            commandOpening('daily-notes:goto-shopping'),
            commandOpening('daily-notes:goto-archive'),
          ),
        )

        const outcome = await engineOf().processUtterance('open all three')

        expect(outcome.outcome).toEqual(Outcomes.success('done'))
      })
    })

    describe('when a command opens a note and an edit follows it in the batch', () => {
      beforeEach(() => {
        opensDailyNote()
      })

      it('refuses the edit, since the target moved ahead of it', async () => {
        respondsWith(aToolTurn(commandOpening('daily-notes:goto-today'), editsTheTarget()))

        await engineOf().processUtterance('open my daily note and add a line')

        const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
        expect(results[1].content).toContain('One note per step')
      })

      it('leaves the note the step was read against unwritten', async () => {
        respondsWith(aToolTurn(commandOpening('daily-notes:goto-today'), editsTheTarget()))

        await engineOf().processUtterance('open my daily note and add a line')

        expect(editor.content).toBe('# Budget\n\nbody')
      })

      it('leaves the note the command opened unwritten', async () => {
        respondsWith(aToolTurn(commandOpening('daily-notes:goto-today'), editsTheTarget()))

        await engineOf().processUtterance('open my daily note and add a line')

        expect(dailyEditor.content).toBe('# Today\n\n## Meetings\n')
      })
    })

    describe('when an edit runs before the command that opens a note', () => {
      beforeEach(() => {
        opensDailyNote()
      })

      it('applies the edit, since nothing had moved when it was dispatched', async () => {
        respondsWith(aToolTurn(editsTheTarget(), commandOpening('daily-notes:goto-today')))

        await engineOf().processUtterance('add a line then open my daily note')

        expect(editor.content).toBe('# Budget\n\nbody\nx')
      })

      it('runs the command, since the edit moved nothing', async () => {
        respondsWith(aToolTurn(editsTheTarget(), commandOpening('daily-notes:goto-today')))

        await engineOf().processUtterance('add a line then open my daily note')

        expect(sessions.targetNote()).toBe(DAILY)
      })
    })
  })

  // A command that opened nothing moved no target, so the guard must not latch
  // on a call that merely might have moved one.
  describe('when a command opens no note', () => {
    beforeEach(() => {
      registry.executeCommandById = (id: string) => {
        registry.executed.push(id)
        return true
      }
    })

    it('applies the edit that follows it to the note the step was read against', async () => {
      respondsWith(
        aToolTurn(
          commandOpening('daily-notes:goto-today'),
          aToolCall('insert_at', { location: 'note_end', content: '\nx' }),
        ),
      )

      await engineOf().processUtterance('run the command then add a line')

      expect(editor.content).toBe('# Budget\n\nbody\nx')
    })

    it('publishes no refusal, since the target never moved', async () => {
      respondsWith(
        aToolTurn(
          commandOpening('daily-notes:goto-today'),
          aToolCall('insert_at', { location: 'note_end', content: '\nx' }),
        ),
      )

      await engineOf().processUtterance('run the command then add a line')

      expect(steps.filter((step) => step.startsWith('Refused'))).toEqual([])
    })

    it('runs a second command that does open one, since nothing had moved', async () => {
      registry.executeCommandById = (id: string) => {
        registry.executed.push(id)
        if (id === 'daily-notes:goto-shopping') workspace.finishesOpening(SHOPPING)
        return true
      }
      respondsWith(
        aToolTurn(
          commandOpening('daily-notes:goto-today'),
          commandOpening('daily-notes:goto-shopping'),
        ),
      )

      await engineOf().processUtterance('run both commands')

      expect(sessions.targetNote()).toBe(SHOPPING)
    })
  })

  // The session binds before the path is resolved, so an unresolvable retarget
  // moves the session's target and leaves the turn's note where it was. Reading
  // the turn's note here would let the following edit through.
  describe('when a command opens a note the vault cannot resolve', () => {
    beforeEach(() => {
      registry.executeCommandById = (id: string) => {
        registry.executed.push(id)
        workspace.finishesOpening('Lists/unreachable.canvas')
        return true
      }
    })

    it('refuses the edit that follows it', async () => {
      respondsWith(
        aToolTurn(
          commandOpening('daily-notes:goto-today'),
          aToolCall('insert_at', { location: 'note_end', content: '\nx' }),
        ),
      )

      await engineOf().processUtterance('open it and add a line')

      const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[1].content).toContain('One note per step')
    })

    it('leaves the note the step was read against unwritten', async () => {
      respondsWith(
        aToolTurn(
          commandOpening('daily-notes:goto-today'),
          aToolCall('insert_at', { location: 'note_end', content: '\nx' }),
        ),
      )

      await engineOf().processUtterance('open it and add a line')

      expect(editor.content).toBe('# Budget\n\nbody')
    })
  })

  describe('when a command is outside the allow-list', () => {
    it('returns a refusal as the tool result when the id is not allowed', async () => {
      respondsWith(aToolTurn(aToolCall('run_command', { command_id: 'file-explorer:delete-file' })))

      await engineOf().processUtterance('delete the file')

      expect(
        complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())[0],
      ).toMatchObject({
        content: expect.stringContaining(
          'file-explorer:delete-file is not an allowed command in this vault',
        ),
      })
    })
  })

  // The reported session ran the same command twice: reported as a success, a
  // command that opened nothing never reached the counter that stops a loop.
  describe('when a command opens no note', () => {
    beforeEach(() => {
      registry.executeCommandById = (id: string) => {
        registry.executed.push(id)
        return true
      }
    })

    it('tells the model a retry changes nothing', async () => {
      respondsWith(runCommand())

      await engineOf().processUtterance('open my daily note')

      expect(
        complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())[0],
      ).toMatchObject({
        content: expect.stringContaining('it opened no note, so nothing changed'),
      })
    })

    it('stops the turn rather than running it forever', async () => {
      complete.mockResolvedValue(Outcomes.success(runCommand()))

      await engineOf().processUtterance('open my daily note')

      expect(registry.executed).toEqual(['daily-notes:goto-today', 'daily-notes:goto-today'])
    })
  })

  describe('when the rebound note sits in another folder', () => {
    beforeEach(() => {
      opensDailyNote()
      instructionVault.withNote('Journal/AGENTS.md', 'Write in second person.')
    })

    it('resolves the new folder chain before the next write when a command retargets', async () => {
      respondsWith(
        runCommand(),
        aToolTurn(aToolCall('insert_at', { location: 'note_end', content: 'x' })),
      )

      await engineOf().processUtterance('open my daily note and add a line')

      expect(complete.mock.calls[2][0][0].content).toContain('Write in second person.')
    })
  })

  describe('when the turn answers from a listing', () => {
    beforeEach(() => {
      vault.withNote('Quotes/roofing.md', 'the roofing quote came to 12k')
    })

    it('reports the answer with its sources when answer_from_search is called', async () => {
      respondsWith(
        aToolTurn(aToolCall('glob_notes', { pattern: 'Quotes/*.md' })),
        aToolTurn(
          aToolCall('answer_from_search', {
            answer: 'The roofing quote was 12k.',
            sources: ['Quotes/roofing.md'],
          }),
        ),
      )

      await engineOf().processUtterance('what did I write about the roofing quote')

      expect(answers).toEqual([
        { text: 'The roofing quote was 12k.', sources: ['Quotes/roofing.md'] },
      ])
    })

    it('applies no edit when the turn answers from a listing', async () => {
      respondsWith(
        aToolTurn(aToolCall('glob_notes', { pattern: 'Quotes/*.md' })),
        aToolTurn(
          aToolCall('answer_from_search', {
            answer: 'It was 12k.',
            sources: ['Quotes/roofing.md'],
          }),
        ),
      )

      await engineOf().processUtterance('what did I write about the roofing quote')

      expect(editor.content).toBe('# Budget\n\nbody')
    })

    it('says nothing matched when the glob finds nothing', async () => {
      respondsWith(aToolTurn(aToolCall('glob_notes', { pattern: 'Plumbing/*.md' })))

      await engineOf().processUtterance('what did I write about plumbing')

      const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[0]).toMatchObject({ content: 'no notes match Plumbing/*.md' })
    })

    const anAnswer = (answer: string, sources: string[] = ['Quotes/roofing.md']) =>
      aToolCall('answer_from_search', { answer, sources })

    const modelMessagesIn = (): string[] =>
      sessions
        .chatHistory()
        .filter((message) => message.apiRole() === 'assistant' && !message.hasToolCalls())
        .map((message) => message.content)

    describe('when the batch holds one answer', () => {
      it('ends the turn on the step that answered', async () => {
        respondsWith(aToolTurn(anAnswer('The roofing quote was 12k.')))

        const result = await engineOf().processUtterance('what was the roofing quote')

        expect(result.outcome).toEqual(Outcomes.success('The roofing quote was 12k.'))
      })

      it('makes no further model call', async () => {
        respondsWith(aToolTurn(anAnswer('The roofing quote was 12k.')))

        await engineOf().processUtterance('what was the roofing quote')

        expect(complete).toHaveBeenCalledTimes(1)
      })
    })

    describe('when the batch holds an answer and a later call', () => {
      it('runs the later call and appends its result', async () => {
        respondsWith(
          aToolTurn(anAnswer('It was 12k.'), aToolCall('glob_notes', { pattern: 'Quotes/*.md' })),
        )

        await engineOf().processUtterance('what was the roofing quote')

        const results = sessions.chatHistory().filter((message) => message.isToolResult())
        expect(results[1].content).toContain('Quotes/roofing.md')
      })

      it('ends the turn once the step is complete', async () => {
        respondsWith(
          aToolTurn(anAnswer('It was 12k.'), aToolCall('glob_notes', { pattern: 'Quotes/*.md' })),
        )

        const result = await engineOf().processUtterance('what was the roofing quote')

        expect(result.outcome).toEqual(Outcomes.success('It was 12k.'))
      })
    })

    describe('when the batch holds two answers', () => {
      it('publishes both answer blocks to the panel', async () => {
        respondsWith(aToolTurn(anAnswer('It was 12k.'), anAnswer('It was paid in March.')))

        await engineOf().processUtterance('what was the roofing quote')

        expect(answers.map((published) => published.text)).toEqual([
          'It was 12k.',
          'It was paid in March.',
        ])
      })

      it('appends the first answer to the history', async () => {
        respondsWith(aToolTurn(anAnswer('It was 12k.'), anAnswer('It was paid in March.')))

        await engineOf().processUtterance('what was the roofing quote')

        expect(modelMessagesIn().at(-1)).toBe('It was 12k.')
      })
    })

    describe('when the batch holds an answer and two identical refusals', () => {
      it('ends the turn as stuck rather than as answered', async () => {
        respondsWith(
          aToolTurn(
            anAnswer('It was 12k.'),
            aToolCall('open_note', { path: 'elsewhere.md' }),
            aToolCall('open_note', { path: 'elsewhere.md' }),
          ),
        )

        const result = await engineOf().processUtterance('what was the roofing quote')

        expect(result.outcome.succeeded()).toBe(false)
      })
    })

    describe('when the batch holds no answer', () => {
      it('keeps the turn going, as today', async () => {
        respondsWith(aToolTurn(aToolCall('glob_notes', { pattern: 'Quotes/*.md' })))

        await engineOf().processUtterance('what did I write about the roofing quote')

        expect(complete).toHaveBeenCalledTimes(2)
      })
    })

    describe('when the turn ends on its answer', () => {
      it('appends the answer text as a model message', async () => {
        respondsWith(aToolTurn(anAnswer('The roofing quote was 12k.')))

        await engineOf().processUtterance('what was the roofing quote')

        expect(modelMessagesIn().at(-1)).toBe('The roofing quote was 12k.')
      })

      it('appends no sources beside it', async () => {
        respondsWith(aToolTurn(anAnswer('The roofing quote was 12k.')))

        await engineOf().processUtterance('what was the roofing quote')

        expect(modelMessagesIn().at(-1)).not.toContain('Quotes/roofing.md')
      })

      it('moves no cursor, since the turn wrote nothing', async () => {
        respondsWith(aToolTurn(anAnswer('The roofing quote was 12k.')))

        await engineOf().processUtterance('what was the roofing quote')

        expect(editor.scrolledTo).toBeNull()
      })
    })
  })

  describe('when the turn greps for a phrase', () => {
    beforeEach(() => {
      vault.withNote('Quotes/roofing.md', 'the roofing quote came to 12k')
    })

    it('names the note and its excerpt when a grep finds a phrase', async () => {
      respondsWith(aToolTurn(aToolCall('grep_notes', { pattern: 'roofing' })))

      await engineOf().processUtterance('what did I write about roofing')

      const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[0]).toMatchObject({
        content: 'Quotes/roofing.md (1 match): the roofing quote came to 12k',
      })
    })

    it('answers a question about the vault from what a grep returned', async () => {
      respondsWith(
        aToolTurn(aToolCall('grep_notes', { pattern: 'roofing' })),
        aToolTurn(
          aToolCall('answer_from_search', {
            answer: 'The roofing quote was 12k.',
            sources: ['Quotes/roofing.md'],
          }),
        ),
      )

      await engineOf().processUtterance('what did I write about the roofing quote')

      expect(answers).toEqual([
        { text: 'The roofing quote was 12k.', sources: ['Quotes/roofing.md'] },
      ])
    })

    it('reads the note a grep held when the model follows it with a read', async () => {
      respondsWith(
        aToolTurn(aToolCall('grep_notes', { pattern: 'roofing', paths_only: true })),
        aToolTurn(aToolCall('read_note', { path: 'Quotes/roofing.md' })),
      )

      await engineOf().processUtterance('find the roofing note and read it')

      const results = complete.mock.calls[2][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[1]).toMatchObject({ content: 'the roofing quote came to 12k' })
    })
  })

  describe('when the turn reads a note', () => {
    it('returns the full contents when read_note names a note', async () => {
      vault.withNote('Quotes/roofing.md', 'the roofing quote came to 12k')
      respondsWith(aToolTurn(aToolCall('read_note', { path: 'Quotes/roofing.md' })))

      await engineOf().processUtterance('read the roofing note')

      const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[0]).toMatchObject({ content: 'the roofing quote came to 12k' })
    })

    it('does not move the target when read_note names a note', async () => {
      vault.withNote('Quotes/roofing.md', 'the roofing quote came to 12k')
      respondsWith(aToolTurn(aToolCall('read_note', { path: 'Quotes/roofing.md' })))

      await engineOf().processUtterance('read the roofing note')

      expect(sessions.targetNote()).toBe('note.md')
    })
  })

  describe('when the vault allows no commands and disables search', () => {
    // NFR8: no command or search tool leaks into a vault that disabled both.
    // The edit tools are not frozen by it, and write_note joins them.
    it('offers the edit tools alone when neither flow is available', async () => {
      respondsWith()

      await engineOf([], false).processUtterance('edit')

      expect(complete.mock.calls[0][1].map((schema) => schema.name)).toEqual([
        'replace_text',
        'insert_text',
        'insert_at',
        'write_note',
        'load_skill',
      ])
    })
  })

  // A markdown note the command opened is writable whether or not its editor
  // has mounted: the write goes through the vault (D5). The target still moves,
  // which is what the retry needs.
  describe('when the opened note has no editor', () => {
    beforeEach(() => {
      opensDailyNote()
      noteLocator.closeNote(DAILY)
      vault.withNote(DAILY, '- milk')
    })

    it('tells the model the session is now editing it', async () => {
      respondsWith(runCommand())

      await engineOf().processUtterance('open my daily note')

      const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[0]).toMatchObject({
        content: `ran Open today; the session is now editing ${DAILY}`,
      })
    })

    it('moves the target to the opened note when the opened note has no editor', async () => {
      respondsWith(runCommand())

      await engineOf().processUtterance('open my daily note')

      expect(sessions.targetNote()).toBe(DAILY)
    })

    it('applies a following edit rather than refusing it', async () => {
      respondsWith(
        runCommand(),
        aToolTurn(aToolCall('insert_at', { location: 'note_end', content: '\n- plates' })),
      )

      await engineOf().processUtterance('open my daily note and add a line')

      const results = complete.mock.calls[2][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[1].content).toContain(`insert_at applied to ${DAILY}`)
    })

    // The anchor matches the note the turn opened away from, so an edit that
    // followed the stale handle would land in it rather than in the target.
    it('leaves the note the turn moved off untouched', async () => {
      respondsWith(
        runCommand(),
        aToolTurn(aToolCall('insert_at', { location: 'note_end', content: '\n- plates' })),
      )

      await engineOf().processUtterance('open my daily note and add a line')

      expect(editor.getValue()).toBe('# Budget\n\nbody')
    })
  })

  describe('when the user opens a note themselves', () => {
    it('moves the target when the user opens a different note', () => {
      engineOf().followActiveNote(DAILY)

      expect(sessions.targetNote()).toBe(DAILY)
    })

    it('reports the move as the users own when no tool is opening a note', () => {
      engineOf().followActiveNote(DAILY)

      expect(retargets).toEqual([{ path: DAILY, byUser: true }])
    })

    it('keeps the target when the user opens the note already targeted', () => {
      engineOf().followActiveNote('note.md')

      expect(sessions.targetNote()).toBe('note.md')
    })

    it('reports nothing when the user opens the note already targeted', () => {
      engineOf().followActiveNote('note.md')

      expect(retargets).toEqual([])
    })

    // A retarget is a session event, so it reaches the panel and stops there.
    // The note context is built per call and names the note now bound, which is
    // what the history message used to say less precisely.
    it('appends nothing to the history when the user opens a different note', () => {
      engineOf().followActiveNote(DAILY)

      expect(sessions.chatHistory()).toEqual([])
    })
  })

  // The utterance was given about the note the turn began on, so it is carried
  // out there. The session binds to the new note for the next turn to resolve.
  describe('when the user opens a note while a turn is running', () => {
    const editsNoteEnd = () =>
      aToolTurn(aToolCall('insert_at', { location: 'note_end', content: '- plates\n' }))

    // Fired between the first model call and the edit, which is the window the
    // running turn has to hear about.
    const opensMidTurn = (engine: EditEngine, path: string) => {
      complete.mockImplementationOnce(async () => {
        await engine.followActiveNote(path)
        return Outcomes.success(editsNoteEnd())
      })
      complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))
    }

    it('edits the note the turn started on, not the one the user opened', async () => {
      const engine = engineOf()
      opensMidTurn(engine, DAILY)

      await engine.processUtterance('add plates to the list')

      expect(editor.content).toBe('# Budget\n\nbody- plates\n')
    })

    it('leaves the note the user opened untouched while the turn runs', async () => {
      const engine = engineOf()
      opensMidTurn(engine, DAILY)

      await engine.processUtterance('add plates to the list')

      expect(dailyEditor.content).toBe('# Today\n\n## Meetings\n')
    })

    it('binds the session to the note the user opened, for the next turn to resolve', async () => {
      const engine = engineOf()
      opensMidTurn(engine, DAILY)

      await engine.processUtterance('add plates to the list')

      expect(sessions.targetNote()).toBe(DAILY)
    })

    // The regression test for the 400. A command that opens a note fires
    // file-open while the tool is still running, so a message appended there
    // landed between the assistant tool call and its result, and Mistral
    // answered `Unexpected role 'tool' after role 'system'`.
    it('sends no system message between a tool call and its result', async () => {
      const engine = engineOf()
      opensMidTurn(engine, DAILY)

      await engine.processUtterance('add plates to the list')

      const sent = complete.mock.calls[1][0]
      expect(systemMessagesSplittingToolPairsIn(sent)).toEqual([])
    })
  })

  // The reported session: the model sent its whole reasoning text as a function
  // name beside a valid replace_text in one batch. The name fell through to the
  // edit tool and was refused there, so the batch produced two results and the
  // model read the applied one as evidence of an earlier edit.
  describe('when the model calls a tool that does not exist', () => {
    const REASONING = 'I should add the item under the heading the user named'

    const resultsOf = (callIndex: number) =>
      complete.mock.calls[callIndex][0].filter((m: ChatMessage) => m.isToolResult())

    it('names the tools that may be called', async () => {
      respondsWith(aToolTurn(aToolCall(REASONING, {})))

      await engineOf().processUtterance('add an item')

      expect(resultsOf(1)[0].content).toContain('the tools you may call are')
    })

    it('names the call it stopped, so the model reads which one was refused', async () => {
      respondsWith(aToolTurn(aToolCall('goto_next_note', {})))

      await engineOf().processUtterance('add an item')

      expect(resultsOf(1)[0].content).toContain('no tool named "goto_next_note"')
    })

    it('truncates a name too long to be one, rather than echoing the blob', async () => {
      respondsWith(aToolTurn(aToolCall(REASONING, {})))

      await engineOf().processUtterance('add an item')

      expect(resultsOf(1)[0].content).not.toContain(REASONING)
    })

    it('publishes a refused step, so a turn stalled on it says why', async () => {
      respondsWith(aToolTurn(aToolCall(REASONING, {})))

      await engineOf().processUtterance('add an item')

      expect(steps.filter((step) => step.startsWith('Refused'))).toHaveLength(1)
    })

    it('reaches the edit tool not at all, so the note is untouched', async () => {
      respondsWith(aToolTurn(aToolCall(REASONING, {})))

      await engineOf().processUtterance('add an item')

      expect(editor.content).toBe('# Budget\n\nbody')
    })

    it('runs no command, so the harness tools are never reached', async () => {
      respondsWith(aToolTurn(aToolCall(REASONING, {})))

      await engineOf().processUtterance('add an item')

      expect(registry.executed).toEqual([])
    })

    describe('when a valid edit shares the batch', () => {
      const aBatch = () =>
        aToolTurn(
          aToolCall(REASONING, {}),
          aToolCall('replace_text', { anchor_text: '# Budget', replacement: '# Costs' }),
        )

      it('applies the edit, since one bad name refuses only itself', async () => {
        respondsWith(aBatch())

        await engineOf().processUtterance('rename the heading')

        expect(editor.content).toBe('# Costs\n\nbody')
      })

      it('refuses the unknown name rather than the edit beside it', async () => {
        respondsWith(aBatch())

        await engineOf().processUtterance('rename the heading')

        expect(resultsOf(1)[0].content).toContain('no tool named')
      })
    })
  })

  describe('when search is turned off', () => {
    it('refuses a glob when search is disabled in settings', async () => {
      respondsWith(aToolTurn(aToolCall('glob_notes', { pattern: 'Quotes/*.md' })))

      await engineOf(['daily-notes:*'], false).processUtterance('what did I write')

      const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[0]).toMatchObject({
        content: 'searching the vault is turned off in settings',
      })
    })

    // Three refusals in one turn read as one repeated failure unless the panel
    // says which call each of them stopped.
    it('names the refused tool in the step, not just the reason', async () => {
      respondsWith(aToolTurn(aToolCall('glob_notes', { pattern: 'Quotes/*.md' })))

      await engineOf(['daily-notes:*'], false).processUtterance('what did I write')

      expect(steps).toContain('Refused glob_notes: searching the vault is turned off in settings')
    })

    // Dispatched before the harness tools, so the refusal has to be restated
    // there: the schema dropping it is never the only thing keeping it away.
    it('refuses an answer when search is disabled in settings', async () => {
      respondsWith(
        aToolTurn(aToolCall('answer_from_search', { answer: 'It was 12k.', sources: [] })),
      )

      await engineOf(['daily-notes:*'], false).processUtterance('what did I write')

      const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[0]).toMatchObject({
        content: 'searching the vault is turned off in settings',
      })
    })

    it('publishes no answer when search is disabled in settings', async () => {
      respondsWith(
        aToolTurn(aToolCall('answer_from_search', { answer: 'It was 12k.', sources: [] })),
      )

      await engineOf(['daily-notes:*'], false).processUtterance('what did I write')

      expect(answers).toEqual([])
    })
  })
})
