import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { SessionRepository } from '../../session/session-repository'
import { HarnessToolsService } from '../tools/harness-tools-service'
import { SearchToolsService } from '../tools/search-tools-service'
import { DateToolService } from '../tools/date-tool-service'
import { NoteChoiceService } from '../waiting/note-choice-service'
import { NotesChosenByUserRepository } from '../turn/notes-chosen-by-user-repository'
import { TurnCancellationController } from '../turn/turn-cancellation-controller'
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
import { NoteReader } from '../../search/note-reader'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeVault } from '../../test-support/fake-vault'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { aSession, aTextTurn, aToolCall, aToolTurn, anEngine } from '../../test-support/builders'

const TODO = 'Lists/todo.md'
const CONTENT = '# Todo\n\n- [x] milk\n- [ ] eggs\n'
const ARCHIVED = '# Todo\n\n- [ ] eggs\n\n## Done\n\n- [x] milk\n'

// A rewrite applies whatever it is given, where an anchor fails loudly. The
// three guards are what make it safe to offer: read this turn, unchanged since,
// and the user confirms, in that order.
describe('EditEngine', () => {
  let editor: FakeEditor
  let sessions: SessionRepository
  let vault: FakeVault
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let asked: string[]

  beforeEach(() => {
    vi.clearAllMocks()
    editor = new FakeEditor(CONTENT)
    sessions = aSession(TODO)
    vault = new FakeVault().withNote(TODO, CONTENT)
    complete = vi.fn()
    asked = []
  })

  const readsThenWrites = (readContent = CONTENT) => {
    complete
      .mockResolvedValueOnce(Outcomes.success(aToolTurn(aToolCall('read_note', { path: TODO }))))
      .mockResolvedValueOnce(
        Outcomes.success(
          aToolTurn(aToolCall('write_note', { content: ARCHIVED, read_content: readContent })),
        ),
      )
      .mockResolvedValue(Outcomes.success(aTextTurn('done')))
  }

  const writesWithoutReading = () => {
    complete
      .mockResolvedValueOnce(
        Outcomes.success(
          aToolTurn(aToolCall('write_note', { content: ARCHIVED, read_content: CONTENT })),
        ),
      )
      .mockResolvedValue(Outcomes.success(aTextTurn('done')))
  }

  const harnessOf = (): HarnessToolsService => {
    const app = new FakeCommandRegistry().asApp()
    const registry = new ObsidianCommandRegistry(app)
    const catalogue = new ObsidianCommandCatalogue(registry, new AllowList([]))
    return new HarnessToolsService(
      new ObsidianCommandRunner(app, catalogue, new OpenedNoteWait(app, 0), registry),
      new NoteReader(vault.asVault()),
      catalogue,
      true,
      new SearchToolsService(new NoteGlob(vault.asVault()), new NoteGrep(vault.asVault())),
      new DateToolService(),
    )
  }

  // Confirms the write when the user is asked about this note, and declines
  // otherwise, so a test states the answer rather than wiring a service.
  const confirming =
    (confirms: boolean) =>
    (cancellation: TurnCancellationController, chosen: NotesChosenByUserRepository) =>
      NoteChoiceService.of(
        (request) => {
          asked.push(...request.candidates)
          return Promise.resolve(confirms ? request.candidates[0] : null)
        },
        cancellation,
        chosen,
      )

  const engineOf = (confirms = true) =>
    anEngine(
      { complete },
      {
        sessions,
        noteLocator: new FakeNoteLocator().withOpenNote(TODO, editor),
        agentsMdRepository: new AgentsMdRepository(new FakeVault().asVault()),
        harnessToolsService: harnessOf(),
        noteChoiceService: confirming(confirms),
      },
    )

  const toolResults = () =>
    sessions
      .chatHistory()
      .filter((message: ChatMessage) => message.isToolResult())
      .map((message: ChatMessage) => message.content)

  describe('when the note was read this turn and has not changed', () => {
    describe('when the user confirms', () => {
      beforeEach(() => readsThenWrites())

      it('replaces the whole note', async () => {
        await engineOf().processUtterance('archive the done items')

        expect(editor.content).toBe(ARCHIVED)
      })

      it('reports the operation and the note, as an anchored edit does', async () => {
        await engineOf().processUtterance('archive the done items')

        expect(toolResults()[1]).toContain(`write_note applied to ${TODO}`)
      })
    })

    describe('when the user declines', () => {
      beforeEach(() => readsThenWrites())

      it('writes nothing', async () => {
        await engineOf(false).processUtterance('archive the done items')

        expect(editor.content).toBe(CONTENT)
      })
    })
  })

  describe('when the note was not read this turn', () => {
    beforeEach(() => writesWithoutReading())

    it('refuses, naming the read rather than the content', async () => {
      await engineOf().processUtterance('archive the done items')

      expect(toolResults()[0]).toContain('call read_note')
    })

    it('writes nothing', async () => {
      await engineOf().processUtterance('archive the done items')

      expect(editor.content).toBe(CONTENT)
    })

    it('asks the user nothing, so no confirmation is spent on a refused write', async () => {
      await engineOf().processUtterance('archive the done items')

      expect(asked).toEqual([])
    })
  })

  describe('when the note changed since the model read it', () => {
    beforeEach(() => {
      readsThenWrites('# Todo\n\nwhat the model thinks it read\n')
    })

    it('refuses, naming that the note moved', async () => {
      await engineOf().processUtterance('archive the done items')

      expect(toolResults()[1]).toContain('has changed since you read it')
    })

    it('writes nothing', async () => {
      await engineOf().processUtterance('archive the done items')

      expect(editor.content).toBe(CONTENT)
    })

    it('refuses before asking the user, so no confirmation is spent on a stale write', async () => {
      await engineOf().processUtterance('archive the done items')

      expect(asked).toEqual([])
    })
  })
})
