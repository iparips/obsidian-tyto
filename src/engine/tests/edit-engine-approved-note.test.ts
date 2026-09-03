import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { App } from 'obsidian'
import { SessionRepository } from '../../session/session-repository'
import { ApprovalRepository } from '../../session/approval-repository'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { HarnessTools } from '../harness-tools'
import { SearchTools } from '../search-tools'
import { OpenApproval } from '../open-approval'
import { TurnCancellation } from '../turn-cancellation'
import { Outcomes } from '../../shared/models/outcome'
import { ChatProvider } from '../../providers/types'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { AllowList } from '../../commands/allow-list'
import { CommandCatalogue } from '../../commands/command-catalogue'
import { CommandRegistry } from '../../commands/command-registry'
import { CommandRunner } from '../../commands/command-runner'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { NoteGlob } from '../../search/note-glob'
import { NoteGrep } from '../../search/note-grep'
import { NoteReader } from '../../search/note-reader'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeVault } from '../../test-support/fake-vault'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'
import { FakeWorkspace } from '../../test-support/fake-workspace'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { aSession, aTextTurn, aToolCall, aToolTurn, anEngine } from '../../test-support/builders'

const FRIDAY = '1 - Journal/Weekly/Week-35/08-28-Fri.md'
const TODAY = '1 - Journal/Weekly/Week-36/09-03-Thu.md'
const TOMORROW = '1 - Journal/Weekly/Week-36/09-04-Fri.md'

// A command opens a note without the model choosing which, so a turn that has
// already approved one can be moved off it mid-instruction. Returning to the
// approved note must cost neither a second approval nor a second open.
describe('EditEngine', () => {
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let vault: FakeVault
  let sessions: SessionRepository
  let approved: ApprovalRepository
  let registry: FakeCommandRegistry
  let workspace: FakeWorkspace
  let fridayEditor: FakeEditor
  let asked: string[]

  beforeEach(() => {
    vi.clearAllMocks()
    complete = vi.fn()
    asked = []
    approved = new ApprovalRepository()
    fridayEditor = new FakeEditor('# Friday\n')
    vault = new FakeVault()
      .withNote(FRIDAY, '# Friday\n')
      .withNote(TODAY, '# Today\n')
      .withNote(TOMORROW, '# Tomorrow\n')
    sessions = aSession(TODAY)
    registry = new FakeCommandRegistry().withCommand('daily-notes:goto-today', 'Open today')
    workspace = new FakeWorkspace(TODAY)
  })

  const opensTomorrow = () => {
    registry.executeCommandById = (id: string) => {
      registry.executed.push(id)
      workspace.finishesOpening(TOMORROW)
      return true
    }
  }

  const harnessOf = (): HarnessTools => {
    const app = {
      ...registry.asApp(),
      workspace: workspace.asWorkspace(),
    } as unknown as App
    const commandRegistry = new CommandRegistry(app)
    const catalogue = new CommandCatalogue(commandRegistry, new AllowList(['daily-notes:*']))
    return new HarnessTools(
      new CommandRunner(app, catalogue, new OpenedNoteWait(app, 30), commandRegistry),
      new NoteReader(vault.asVault()),
      catalogue,
      true,
      new SearchTools(new NoteGlob(vault.asVault()), new NoteGrep(vault.asVault())),
    )
  }

  // Declines the named path and grants every other, so a test states which
  // note the user said no to rather than wiring an approval per case.
  const approving = (refused: string | null) => (cancellation: TurnCancellation) =>
    OpenApproval.of(
      (path) => {
        asked.push(path)
        return Promise.resolve(path !== refused)
      },
      cancellation,
      approved,
    )

  const engineOf = (refused: string | null = null) =>
    anEngine(
      { complete },
      {
        sessions,
        noteLocator: new FakeNoteLocator()
          .withOpenNote(TODAY, new FakeEditor('# Today\n'))
          .withOpenNote(TOMORROW, new FakeEditor('# Tomorrow\n'))
          .withOpenNote(FRIDAY, fridayEditor),
        agentsMdRepository: new AgentsMdRepository(new FakeAdapter().asAdapter()),
        harnessTools: harnessOf(),
        openApproval: approving(refused),
        progress: TurnProgressPublisher.silent(),
      },
    )

  const respondsWith = (...turns: ReturnType<typeof aToolTurn>[]) => {
    turns.forEach((turn) => complete.mockResolvedValueOnce(Outcomes.success(turn)))
    complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))
  }

  const findsFriday = () =>
    aToolTurn(aToolCall('glob_notes', { pattern: '1 - Journal/Weekly/Week-35/*.md' }))

  const opensFriday = () => aToolTurn(aToolCall('open_note', { path: FRIDAY }))

  const opensTomorrowNote = () => aToolTurn(aToolCall('open_note', { path: TOMORROW }))

  const runsCommand = () =>
    aToolTurn(aToolCall('run_command', { command_id: 'daily-notes:goto-today' }))

  const addsLine = () =>
    aToolTurn(aToolCall('insert_at', { location: 'note_start', content: 'A beautiful day.\n' }))

  describe('when a command moves the target off an approved note', () => {
    beforeEach(() => {
      opensTomorrow()
    })

    it('asks once when the model reopens the approved note', async () => {
      respondsWith(findsFriday(), opensFriday(), runsCommand(), opensFriday())

      await engineOf().processUtterance('add a line to last Friday')

      expect(asked).toEqual([FRIDAY])
    })

    it('returns the target to the approved note when the model reopens it', async () => {
      respondsWith(findsFriday(), opensFriday(), runsCommand(), opensFriday())

      await engineOf().processUtterance('add a line to last Friday')

      expect(sessions.targetNote()).toBe(FRIDAY)
    })

    it('applies the edit to the approved note when the model reopens it', async () => {
      respondsWith(findsFriday(), opensFriday(), runsCommand(), opensFriday(), addsLine())

      await engineOf().processUtterance('add a line to last Friday')

      expect(fridayEditor.content).toBe('A beautiful day.\n# Friday\n')
    })
  })

  // A decline is the user saying "not that note", which usually means another
  // one is right. Spending the turn's one open on it leaves nothing to say yes
  // to, and the model reaches for whatever tool has no guard.
  describe('when the user declines a note', () => {
    const findsBoth = () =>
      aToolTurn(aToolCall('glob_notes', { pattern: '1 - Journal/Weekly/**/*.md' }))

    it('asks about a second note after the first was declined', async () => {
      respondsWith(findsBoth(), opensTomorrowNote(), opensFriday())

      await engineOf(TOMORROW).processUtterance('find last Friday')

      expect(asked).toEqual([TOMORROW, FRIDAY])
    })

    it('opens the second note after the first was declined', async () => {
      respondsWith(findsBoth(), opensTomorrowNote(), opensFriday())

      await engineOf(TOMORROW).processUtterance('find last Friday')

      expect(sessions.targetNote()).toBe(FRIDAY)
    })
  })

  describe('when a later turn opens the same note', () => {
    it('asks nothing when a second turn opens a note the first approved', async () => {
      respondsWith(findsFriday(), opensFriday())
      await engineOf().processUtterance('find last Friday')

      respondsWith(findsFriday(), opensFriday())
      await engineOf().processUtterance('open it again')

      expect(asked).toEqual([FRIDAY])
    })
  })
})
