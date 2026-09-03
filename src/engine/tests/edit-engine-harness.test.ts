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
import { VaultSearch } from '../../search/vault-search'
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
  let commands: string[]
  let answers: { text: string; sources: string[] }[]

  beforeEach(() => {
    vi.clearAllMocks()
    editor = new FakeEditor('# Budget\n\nbody')
    dailyEditor = new FakeEditor('# Today\n\n## Meetings\n')
    complete = vi.fn()
    registry = new FakeCommandRegistry().withCommand('daily-notes:goto-today', 'Open today')
    workspace = new FakeWorkspace('note.md')
    vault = new FakeVault()
    adapter = new FakeAdapter()
    commands = []
    answers = []
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
      new VaultSearch(vault.asVault()),
      new NoteReader(vault.asVault()),
      catalogue,
      searchEnabled,
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
          (text) => commands.push(text),
          (text, sources) => answers.push({ text, sources }),
          () => undefined,
          () => undefined,
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

      expect(commands).toEqual([`ran Open today; the session is now editing ${DAILY}`])
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

      expect(commands).toEqual(['ran Open today; no note opened, still editing the same note'])
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

  describe('when the turn answers from a search', () => {
    beforeEach(() => {
      vault.withNote('Quotes/roofing.md', 'the roofing quote came to 12k')
    })

    it('reports the answer with its sources when answer_from_search is called', async () => {
      respondsWith(
        aToolTurn(aToolCall('search_vault', { query: 'roofing' })),
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

    it('applies no edit when the turn answers from a search', async () => {
      respondsWith(
        aToolTurn(aToolCall('search_vault', { query: 'roofing' })),
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

    it('says nothing matched when the search finds nothing', async () => {
      respondsWith(aToolTurn(aToolCall('search_vault', { query: 'plumbing' })))

      await engineOf().processUtterance('what did I write about plumbing')

      const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[0]).toMatchObject({ content: 'no notes matched that search' })
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

  describe('when the turn exceeds a per-turn cap', () => {
    it('refuses a fourth command when the command cap is reached', async () => {
      respondsWith(runCommand(), runCommand(), runCommand(), runCommand())

      await engineOf().processUtterance('run them all')

      const results = complete.mock.calls[4][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[3]).toMatchObject({
        content: 'this turn has already run 3 commands; run no more',
      })
    })

    it('refuses a fifth search when the search cap is reached', async () => {
      const search = () => aToolTurn(aToolCall('search_vault', { query: 'roofing' }))
      respondsWith(search(), search(), search(), search(), search())

      await engineOf().processUtterance('search over and over')

      const results = complete.mock.calls[5][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[4]).toMatchObject({
        content: 'this turn has already searched or read 4 times; answer from what you have',
      })
    })
  })

  describe('when the opened note has no editor', () => {
    beforeEach(() => {
      opensDailyNote()
      noteLocator.closeNote(DAILY)
    })

    it('tells the model the target did not move when the opened note has no editor', async () => {
      respondsWith(runCommand())

      await engineOf().processUtterance('open my daily note')

      const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[0]).toMatchObject({
        content: 'ran Open today; no note opened, still editing the same note',
      })
    })

    it('leaves the target on the original note when the opened note has no editor', async () => {
      respondsWith(runCommand())

      await engineOf().processUtterance('open my daily note')

      expect(sessions.targetNote()).toBe('note.md')
    })
  })

  describe('when the user returns the session to its starting note', () => {
    beforeEach(() => {
      opensDailyNote()
    })

    it('moves the target back when the session is returned', async () => {
      respondsWith(runCommand())
      const engine = engineOf()
      await engine.processUtterance('open my daily note')

      engine.returnToStartingNote()

      expect(sessions.targetNote()).toBe('note.md')
    })

    it('keeps the conversation when the session is returned', async () => {
      respondsWith(runCommand())
      const engine = engineOf()
      await engine.processUtterance('open my daily note')

      engine.returnToStartingNote()
      await engine.processUtterance('now edit it')

      expect(complete.mock.calls[2][0].filter((m: ChatMessage) => m.isUser())).toHaveLength(2)
    })
  })

  describe('when search is turned off', () => {
    it('refuses a search when search is disabled in settings', async () => {
      respondsWith(aToolTurn(aToolCall('search_vault', { query: 'roofing' })))

      await engineOf(['daily-notes:*'], false).processUtterance('what did I write')

      const results = complete.mock.calls[1][0].filter((m: ChatMessage) => m.isToolResult())
      expect(results[0]).toMatchObject({
        content: 'searching the vault is turned off in settings',
      })
    })
  })
})
