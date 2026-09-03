import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { App } from 'obsidian'
import { SessionRepository } from '../../session/session-repository'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { HarnessTools } from '../harness-tools'
import { Outcomes } from '../../shared/models/outcome'
import { ChatMessage, ChatProvider } from '../../providers/types'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { AllowList } from '../../commands/allow-list'
import { CommandCatalogue } from '../../commands/command-catalogue'
import { CommandRegistry } from '../../commands/command-registry'
import { CommandRunner } from '../../commands/command-runner'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { NoteGlob } from '../../search/note-glob'
import { NoteGrep } from '../../search/note-grep'
import { SearchTools } from '../search-tools'
import { NoteReader } from '../../search/note-reader'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeVault } from '../../test-support/fake-vault'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'
import { FakeWorkspace } from '../../test-support/fake-workspace'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { aSession, aTextTurn, aToolCall, aToolTurn, anEngine } from '../../test-support/builders'

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
  let retargets: string[]

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

  const harnessOf = (allowed: string[], searchEnabled: boolean): HarnessTools => {
    const app = appOf()
    const commandRegistry = new CommandRegistry(app)
    const catalogue = new CommandCatalogue(commandRegistry, new AllowList(allowed))
    return new HarnessTools(
      new CommandRunner(app, catalogue, new OpenedNoteWait(app, 30), commandRegistry),
      new NoteReader(vault.asVault()),
      catalogue,
      searchEnabled,
      new SearchTools(new NoteGlob(vault.asVault()), new NoteGrep(vault.asVault())),
    )
  }

  const engineOf = (allowed: string[] = ['daily-notes:*'], searchEnabled = true) =>
    anEngine(
      { complete },
      {
        sessions,
        noteLocator,
        agentsMdRepository: new AgentsMdRepository(adapter.asAdapter()),
        harnessTools: harnessOf(allowed, searchEnabled),
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
        content: 'file-explorer:delete-file is not an allowed command in this vault',
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

  describe('when search is turned off', () => {
    it('refuses a glob when search is disabled in settings', async () => {
      respondsWith(aToolTurn(aToolCall('glob_notes', { pattern: 'Quotes/*.md' })))

      await engineOf(['daily-notes:*'], false).processUtterance('what did I write')

      const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[0]).toMatchObject({
        content: 'searching the vault is turned off in settings',
      })
    })
  })
})
