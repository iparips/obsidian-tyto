import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { App } from 'obsidian'
import { SessionRepository } from '../../session/session-repository'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { HarnessTools } from '../harness-tools'
import { SearchTools } from '../search-tools'
import { NoteChoice } from '../note-choice'
import { ChosenNotes } from '../models/chosen-notes'
import { TurnCancellation } from '../turn-cancellation'
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
// already had one chosen can be moved off it mid-instruction. Returning to the
// chosen note must cost neither a second question nor a second open.
//
// The two scopes are what these tests hold apart: a note the model found stays
// found for the session, and a note the user chose is chosen for the turn. That
// needs two turns on one engine to test at all.
describe('EditEngine', () => {
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let vault: FakeVault
  let sessions: SessionRepository
  let registry: FakeCommandRegistry
  let workspace: FakeWorkspace
  let fridayEditor: FakeEditor
  let asked: string[]

  beforeEach(() => {
    vi.clearAllMocks()
    complete = vi.fn()
    asked = []
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

  // Picks the named path when it is offered and declines otherwise, so a test
  // states which note the user pointed at rather than wiring a choice per case.
  const picking = (pick: string | null) => (cancellation: TurnCancellation, chosen: ChosenNotes) =>
    NoteChoice.of(
      (request) => {
        asked.push(...request.candidates)
        return Promise.resolve(request.candidates.includes(pick ?? '') ? pick : null)
      },
      cancellation,
      chosen,
    )

  const engineOf = (pick: string | null = null) =>
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
        noteChoice: picking(pick),
        progress: TurnProgressPublisher.silent(),
      },
    )

  // The last result the model was handed, wherever in the conversation it fell:
  // these tests run two turns on one engine, so a fixed call index names a
  // different turn depending on how many calls the first one made.
  const lastToolResult = () =>
    complete.mock.calls
      .at(-1)?.[0]
      .filter((message: ChatMessage) => message.isToolResult())
      .at(-1)

  const respondsWith = (...turns: ReturnType<typeof aToolTurn>[]) => {
    turns.forEach((turn) => complete.mockResolvedValueOnce(Outcomes.success(turn)))
    complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))
  }

  const findsFriday = () =>
    aToolTurn(aToolCall('glob_notes', { pattern: '1 - Journal/Weekly/Week-35/*.md' }))

  const opensFriday = () => aToolTurn(aToolCall('open_note', { path: FRIDAY }))

  const runsCommand = () =>
    aToolTurn(aToolCall('run_command', { command_id: 'daily-notes:goto-today' }))

  const addsLine = () =>
    aToolTurn(aToolCall('insert_at', { location: 'note_start', content: 'A beautiful day.\n' }))

  const offersFriday = () =>
    aToolTurn(aToolCall('choose_note', { paths: [FRIDAY], purpose: 'add a line' }))

  const offersBoth = () =>
    aToolTurn(aToolCall('choose_note', { paths: [TOMORROW, FRIDAY], purpose: 'add a line' }))

  describe('when a command moves the target off a chosen note', () => {
    beforeEach(() => {
      opensTomorrow()
    })

    it('asks once when the model reopens the chosen note', async () => {
      respondsWith(findsFriday(), offersFriday(), opensFriday(), runsCommand(), opensFriday())

      await engineOf(FRIDAY).processUtterance('add a line to last Friday')

      expect(asked).toEqual([FRIDAY])
    })

    it('returns the target to the chosen note when the model reopens it', async () => {
      respondsWith(findsFriday(), offersFriday(), opensFriday(), runsCommand(), opensFriday())

      await engineOf(FRIDAY).processUtterance('add a line to last Friday')

      expect(sessions.targetNote()).toBe(FRIDAY)
    })

    it('applies the edit to the chosen note when the model reopens it', async () => {
      respondsWith(
        findsFriday(),
        offersFriday(),
        opensFriday(),
        runsCommand(),
        opensFriday(),
        addsLine(),
      )

      await engineOf(FRIDAY).processUtterance('add a line to last Friday')

      expect(fridayEditor.content).toBe('A beautiful day.\n# Friday\n')
    })
  })

  // A decline is the user saying "none of these", which usually means the model
  // has to ask what they meant. Spending the turn's one open on it would leave
  // nothing to redirect to, and the model reaches for whatever tool has no guard.
  describe('when the user declines a shortlist', () => {
    const findsBoth = () =>
      aToolTurn(aToolCall('glob_notes', { pattern: '1 - Journal/Weekly/**/*.md' }))

    it('opens nothing when the user declines every candidate', async () => {
      respondsWith(findsBoth(), offersBoth(), opensFriday())

      await engineOf(null).processUtterance('find last Friday')

      expect(sessions.targetNote()).toBe(TODAY)
    })

    it('leaves the turn its open to spend when a second shortlist is offered', async () => {
      respondsWith(findsBoth(), offersBoth(), offersFriday(), opensFriday())

      await engineOf(FRIDAY).processUtterance('find last Friday')

      expect(sessions.targetNote()).toBe(FRIDAY)
    })

    it('offers the second shortlist after the first was declined', async () => {
      respondsWith(findsBoth(), offersBoth(), offersFriday(), opensFriday())

      await engineOf(FRIDAY).processUtterance('find last Friday')

      expect(asked).toEqual([TOMORROW, FRIDAY, FRIDAY])
    })
  })

  // The two scopes, each proved across two turns on one engine. A fixture that
  // opens one turn proves neither, which is how the scope bug this replaces
  // passed every test in the suite.
  describe('when a second turn reaches the same note', () => {
    let engine: ReturnType<typeof engineOf>

    beforeEach(async () => {
      engine = engineOf(FRIDAY)
      respondsWith(findsFriday(), offersFriday(), opensFriday())
      await engine.processUtterance('add a line to last Friday')
    })

    it('asks again in a second turn for a note chosen in the first, since consent is per turn', async () => {
      respondsWith(findsFriday(), offersFriday(), opensFriday())

      await engine.processUtterance('open it again')

      expect(asked).toEqual([FRIDAY, FRIDAY])
    })

    it('refuses a second turn opening a note chosen in the first, rather than opening it unchosen', async () => {
      respondsWith(opensFriday())

      await engine.processUtterance('open it again')

      expect(lastToolResult()).toMatchObject({
        content: `${FRIDAY} was not chosen by the user this turn; call choose_note with it now, then open it. Do not ask the user in prose`,
      })
    })

    it('opens a note found in an earlier turn without re-searching, since finding is per session', async () => {
      respondsWith(offersFriday(), opensFriday())

      await engine.processUtterance('open it again')

      expect(asked).toEqual([FRIDAY, FRIDAY])
    })
  })
})
