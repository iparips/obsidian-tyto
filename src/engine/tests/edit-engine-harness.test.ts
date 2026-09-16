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
import { NoteGlob } from '../../search/note-glob'
import { NoteGrep } from '../../search/note-grep'
import { SearchToolsService } from '../tools/search-tools-service'
import { DateToolService } from '../tools/date-tool-service'
import { NoteReader } from '../../search/note-reader'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeVault } from '../../test-support/fake-vault'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'
import { FakeWorkspace } from '../../test-support/fake-workspace'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { aSession, aTextTurn, aToolCall, aToolTurn, anEngine } from '../../test-support/builders'
import { EditEngine } from '../edit-engine'

const DAILY = 'Journal/2026-09-02.md'

describe('EditEngine', () => {
  let editor: FakeEditor
  let dailyEditor: FakeEditor
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let registry: FakeCommandRegistry
  let workspace: FakeWorkspace
  let vault: FakeVault
  let adapter: FakeAdapter
  let noteLocator: FakeNoteLocator
  let sessions: SessionRepository
  let steps: string[]
  let answers: { text: string; sources: string[] }[]
  let retargets: (string | null)[]

  beforeEach(() => {
    vi.clearAllMocks()
    editor = new FakeEditor('# Budget\n\nbody')
    dailyEditor = new FakeEditor('# Today\n\n## Meetings\n')
    complete = vi.fn()
    registry = new FakeCommandRegistry().withCommand('daily-notes:goto-today', 'Open today')
    workspace = new FakeWorkspace('note.md')
    vault = new FakeVault()
    adapter = new FakeAdapter()
    steps = []
    answers = []
    retargets = []
    sessions = aSession()
    noteLocator = new FakeNoteLocator()
      .withOpenNote('note.md', editor)
      .withOpenNote(DAILY, dailyEditor)
  })

  const opensDailyNote = () => {
    registry.executeCommandById = (id: string) => {
      registry.executed.push(id)
      workspace.finishesOpening(DAILY)
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
      new ObsidianCommandRunner(app, catalogue, new OpenedNoteWait(app, 30), commandRegistry),
      new NoteReader(vault.asVault()),
      catalogue,
      searchEnabled,
      new SearchToolsService(new NoteGlob(vault.asVault()), new NoteGrep(vault.asVault())),
      new DateToolService(),
    )
  }

  const engineOf = (allowed: string[] = ['daily-notes:*'], searchEnabled = true) =>
    anEngine(
      { complete },
      {
        sessions,
        noteLocator,
        agentsMdRepository: new AgentsMdRepository(adapter.asAdapter()),
        harnessToolsService: harnessOf(allowed, searchEnabled),
        progress: new TurnProgressPublisher(
          (text, sources) => answers.push({ text, sources }),
          (path) => retargets.push(path),
          () => undefined,
          (name) => steps.push(`Loaded skill: ${name}`),
          () => undefined,
          (step) => steps.push(`${step.label}: ${step.detail}`),
        ),
      },
    )

  const respondsWith = (...turns: ReturnType<typeof aToolTurn>[]) => {
    turns.forEach((turn) => complete.mockResolvedValueOnce(Outcomes.success(turn)))
    complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))
  }

  const runCommand = () =>
    aToolTurn(aToolCall('run_command', { command_id: 'daily-notes:goto-today' }))

  describe('when a command opens a note', () => {
    beforeEach(() => {
      opensDailyNote()
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

  describe('when the rebound note sits in another folder', () => {
    beforeEach(() => {
      opensDailyNote()
      adapter.withFile('Journal/AGENTS.md', 'Write in second person.')
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
    it('offers only the release 3 tools when neither flow is available', async () => {
      respondsWith()

      await engineOf([], false).processUtterance('edit')

      expect(complete.mock.calls[0][1].map((schema) => schema.name)).toEqual([
        'replace_text',
        'insert_text',
        'insert_at',
        'load_skill',
      ])
    })
  })

  describe('when the opened note has no editor', () => {
    beforeEach(() => {
      opensDailyNote()
      noteLocator.closeNote(DAILY)
    })

    it('tells the model the note is not editable when the opened note has no editor', async () => {
      respondsWith(runCommand())

      await engineOf().processUtterance('open my daily note')

      const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[0]).toMatchObject({
        content: `ran Open today; ${DAILY} opened but is not editable yet, so no edit was made`,
      })
    })

    it('moves the target to the opened note when the opened note has no editor', async () => {
      respondsWith(runCommand())

      await engineOf().processUtterance('open my daily note')

      expect(sessions.targetNote()).toBe(DAILY)
    })

    it('refuses a following edit when the opened note has no editor', async () => {
      respondsWith(
        runCommand(),
        aToolTurn(aToolCall('insert_at', { location: 'note_end', content: '\n- plates' })),
      )

      await engineOf().processUtterance('open my daily note and add a line')

      const results = complete.mock.calls[2][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[1]).toMatchObject({
        content: `${DAILY} is not editable yet; stop and tell the user to open it`,
      })
    })

    // The anchor matches the note the turn still holds, so an unguarded edit
    // would land in it rather than being refused.
    it('leaves the note the turn still holds untouched when an edit is refused', async () => {
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

    it('reports the move when the user opens a different note', () => {
      engineOf().followActiveNote(DAILY)

      expect(retargets).toEqual([DAILY])
    })

    it('keeps the target when the user opens the note already targeted', () => {
      engineOf().followActiveNote('note.md')

      expect(sessions.targetNote()).toBe('note.md')
    })

    it('reports nothing when the user opens the note already targeted', () => {
      engineOf().followActiveNote('note.md')

      expect(retargets).toEqual([])
    })
  })

  // The user switching tabs mid-turn is a retarget like any other, so the turn
  // running behind it edits the note now in front of them.
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

    it('edits the note the user opened mid-turn, since the running turn followed it', async () => {
      const engine = engineOf()
      opensMidTurn(engine, DAILY)

      await engine.processUtterance('add plates to the list')

      expect(dailyEditor.content).toBe('# Today\n\n## Meetings\n- plates\n')
    })

    it('leaves the turn on its note when a mid-turn open will not resolve', async () => {
      const engine = engineOf()
      opensMidTurn(engine, 'Journal/never-opened.md')

      await engine.processUtterance('add plates to the list')

      expect(editor.content).toBe('# Budget\n\nbody- plates\n')
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
