import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { App } from 'obsidian'
import { SessionRepository } from '../../session/session-repository'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { HarnessToolsService } from '../tools/harness-tools-service'
import { Outcomes } from '../../shared/models/outcome'
import { ChatProvider } from '../../providers/types'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { AllowList } from '../../commands/allow-list'
import { ObsidianCommandCatalogue } from '../../commands/obsidian-command-catalogue'
import { ObsidianCommandRegistry } from '../../commands/obsidian-command-registry'
import { ObsidianCommandRunner } from '../../commands/obsidian-command-runner'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { NoteGlob } from '../../search/note-glob'
import { NoteGrep } from '../../search/note-grep'
import { SearchToolsService } from '../tools/search-tools-service'
import { NoteReader } from '../../search/note-reader'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeVault } from '../../test-support/fake-vault'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'
import { FakeWorkspace } from '../../test-support/fake-workspace'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { aSession, aTextTurn, aToolCall, aToolTurn, anEngine } from '../../test-support/builders'

const TODO = 'Journal/Weekly/Week-36/todo.md'

// The reported failure: the model globbed, then retried the same edit seventeen
// times, each refused word for word, until the turn ran out of steps. The turn
// has to end on the reason rather than spending every step on it.
describe('EditEngine', () => {
  let editor: FakeEditor
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let vault: FakeVault
  let sessions: SessionRepository
  let steps: string[]

  beforeEach(() => {
    vi.clearAllMocks()
    editor = new FakeEditor('# Budget\n\nbody')
    complete = vi.fn()
    vault = new FakeVault().withNote(TODO, '- [ ] milk')
    steps = []
    sessions = aSession()
  })

  const harnessOf = (): HarnessToolsService => {
    const app = {
      ...new FakeCommandRegistry().asApp(),
      workspace: new FakeWorkspace('note.md').asWorkspace(),
    } as unknown as App
    const commandRegistry = new ObsidianCommandRegistry(app)
    const catalogue = new ObsidianCommandCatalogue(commandRegistry, new AllowList([]))
    return new HarnessToolsService(
      new ObsidianCommandRunner(app, catalogue, new OpenedNoteWait(app, 30), commandRegistry),
      new NoteReader(vault.asVault()),
      catalogue,
      true,
      new SearchToolsService(new NoteGlob(vault.asVault()), new NoteGrep(vault.asVault())),
    )
  }

  const engineOf = () =>
    anEngine(
      { complete },
      {
        sessions,
        noteLocator: new FakeNoteLocator().withOpenNote('note.md', editor),
        agentsMdRepository: new AgentsMdRepository(new FakeAdapter().asAdapter()),
        harnessToolsService: harnessOf(),
        progress: new TurnProgressPublisher(
          () => undefined,
          () => undefined,
          () => undefined,
          () => undefined,
          () => undefined,
          (step) => steps.push(`${step.label}: ${step.detail}`),
        ),
      },
    )

  const respondsWith = (...turns: ReturnType<typeof aToolTurn>[]) => {
    turns.forEach((turn) => complete.mockResolvedValueOnce(Outcomes.success(turn)))
    complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))
  }

  const findsTodo = () => aToolTurn(aToolCall('glob_notes', { pattern: 'Journal/**/*.md' }))

  // Refused every time, because the glob means the turn no longer trusts the
  // note it inherited and nothing has opened one since.
  const addsItem = () =>
    aToolTurn(
      aToolCall('insert_text', { anchor_text: '# Budget', position: 'after', content: 'x' }),
    )

  describe('when the model retries an edit the harness keeps refusing', () => {
    beforeEach(() => {
      respondsWith(findsTodo(), addsItem(), addsItem(), addsItem(), addsItem())
    })

    it('fails the turn when the same refusal lands twice', async () => {
      const outcome = await engineOf().processUtterance('add an item to my todo')

      expect(outcome.hasFailed()).toBe(true)
    })

    it('names the refusal when it stops the turn', async () => {
      const outcome = await engineOf().processUtterance('add an item to my todo')

      expect(outcome.hasFailed() && outcome.message).toBe(
        'Owl was refused the same thing 2 times and stopped: note.md was not opened this turn; offer it with choose_note and open it before editing',
      )
    })

    it('stops before the later retries when the same refusal repeats', async () => {
      await engineOf().processUtterance('add an item to my todo')

      expect(steps.filter((step) => step.startsWith('Refused'))).toHaveLength(2)
    })

    it('leaves the note unchanged when the turn stops on a refusal', async () => {
      await engineOf().processUtterance('add an item to my todo')

      expect(editor.content).toBe('# Budget\n\nbody')
    })
  })
})
