import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { EditEngine } from '../edit-engine'
import { Outcome, Outcomes } from '../../shared/models/outcome'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { FakeVault } from '../../test-support/fake-vault'
import { ChatProvider } from '../../model/providers/types'
import { ChatTurn } from '../../model/providers/models/chat-turn'
import { aSession, aTextTurn, aToolCall, aToolTurn, anEngine } from '../../test-support/builders'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { TranscriptRepository } from '../../session/transcript/transcript-repository'
import { TurnEndingKind } from '../turn/ending/turn-ending-kind'
import { HarnessToolsService } from '../tools/harness-tools-service'
import { ObsidianCommandRunner } from '../../commands/obsidian-command-runner'
import { ObsidianCommandCatalogue } from '../../commands/obsidian-command-catalogue'
import { ObsidianCommandRegistry } from '../../commands/obsidian-command-registry'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { AllowList } from '../../commands/allow-list'
import { NoteReader } from '../../search/note-reader'
import { NoteGlob } from '../../search/note-glob'
import { NoteGrep } from '../../search/note-grep'
import { TagReader } from '../../search/tag-reader'
import { SearchToolsService } from '../tools/search-tools-service'
import { DateToolService } from '../tools/date-tool-service'
import { App } from 'obsidian'

// TurnOutcomes builds exhausted and stuck as the same chat failure, so the panel
// shows one message for both. Only the runner knows which it was, and a
// transcript that could not tell them apart would be read as the wrong failure.
describe('ConversationTurnRunner endings', () => {
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let transcript: TranscriptRepository
  let engine: EditEngine

  // Search on, since answer_from_search is refused without it and the ending it
  // now records is what these read.
  const aSearchingHarness = (vault: FakeVault): HarnessToolsService =>
    new HarnessToolsService(
      new ObsidianCommandRunner(
        {} as App,
        new ObsidianCommandCatalogue(new ObsidianCommandRegistry({} as App), new AllowList([])),
        new OpenedNoteWait({} as App),
        new ObsidianCommandRegistry({} as App),
      ),
      new NoteReader(vault.asVault()),
      new ObsidianCommandCatalogue(new ObsidianCommandRegistry({} as App), new AllowList([])),
      true,
      new SearchToolsService(
        new NoteGlob(vault.asVault()),
        new NoteGrep(vault.asVault()),
        new TagReader(vault.asVault(), vault.asMetadataCache()),
      ),
      new DateToolService(),
    )

  beforeEach(() => {
    vi.clearAllMocks()
    complete = vi.fn()
    transcript = new TranscriptRepository()
    const vault = new FakeVault()
    engine = anEngine(
      { complete },
      {
        sessions: aSession(),
        noteLocator: new FakeNoteLocator().withOpenNote('note.md', new FakeEditor('# Budget')),
        agentsMdRepository: new AgentsMdRepository(new FakeVault().asVault()),
        harnessToolsService: aSearchingHarness(vault),
        vault,
        progress: TurnProgressPublisher.silent(),
        transcript,
      },
    )
  })

  const endings = () => transcript.recordedEndings().map((ending) => ending.kind)

  // An append rather than a replace: an anchor found once is not found again,
  // and the turn would end stuck before it ran out of steps.
  const anAppend = () => aToolCall('insert_at', { location: 'note_end', content: '\n- item' })

  const anUnchosenOpen = () => aToolCall('open_note', { path: 'elsewhere.md' })

  describe('when the model answers in text', () => {
    it('records the ending as replied', async () => {
      complete.mockResolvedValue(Outcomes.success(aTextTurn('Nothing to do')))

      await engine.processUtterance('hello')

      expect(endings()).toEqual([TurnEndingKind.Replied])
    })
  })

  describe('when the provider fails', () => {
    it('records the ending as failed', async () => {
      complete.mockResolvedValue(Outcomes.failure('chat', 'the provider is down'))

      await engine.processUtterance('rename it')

      expect(endings()).toEqual([TurnEndingKind.Failed])
    })
  })

  describe('when the turn runs out of steps', () => {
    it('records the ending as exhausted rather than as the chat failure it returns', async () => {
      complete.mockResolvedValue(Outcomes.success(aToolTurn(anAppend())))

      await engine.processUtterance('rename it')

      expect(endings()).toEqual([TurnEndingKind.Exhausted])
    })

    it('holds the step the harness decided it at', async () => {
      complete.mockResolvedValue(Outcomes.success(aToolTurn(anAppend())))

      await engine.processUtterance('rename it')

      expect(transcript.recordedEndings()[0].step).toBe(19)
    })
  })

  describe('when the model is refused the same thing twice', () => {
    it('records the ending as stuck, which the returned outcome cannot say', async () => {
      complete.mockResolvedValue(Outcomes.success(aToolTurn(anUnchosenOpen())))

      await engine.processUtterance('open it')

      expect(endings()).toEqual([TurnEndingKind.Stuck])
    })
  })

  describe('when the model answers from search', () => {
    const anAnswer = (answer = 'The roofing quote was 12k.') =>
      aToolCall('answer_from_search', { answer, sources: [] })

    it('records the ending as answered rather than as replied', async () => {
      complete.mockResolvedValue(Outcomes.success(aToolTurn(anAnswer())))

      await engine.processUtterance('what was the roofing quote')

      expect(endings()).toEqual([TurnEndingKind.Answered])
    })

    it('charges the answering batch its calls and no further step', async () => {
      complete.mockResolvedValue(Outcomes.success(aToolTurn(anAnswer())))

      await engine.processUtterance('what was the roofing quote')

      expect(complete).toHaveBeenCalledTimes(1)
    })

    it('returns the kind beside the outcome for every ending', async () => {
      complete.mockResolvedValue(Outcomes.success(aToolTurn(anAnswer())))

      const result = await engine.processUtterance('what was the roofing quote')

      expect(result).toMatchObject({ value: 'The roofing quote was 12k.' })
    })
  })

  describe('when the model answers from search beside two identical refusals', () => {
    it('records the ending as stuck', async () => {
      complete.mockResolvedValue(
        Outcomes.success(
          aToolTurn(
            aToolCall('answer_from_search', { answer: 'It was 12k.', sources: [] }),
            anUnchosenOpen(),
            anUnchosenOpen(),
          ),
        ),
      )

      await engine.processUtterance('what was the roofing quote')

      expect(endings()).toEqual([TurnEndingKind.Stuck])
    })
  })

  describe('when the user cancels the turn', () => {
    it('records the ending as cancelled', async () => {
      complete.mockImplementation(
        (_messages, _tools, signal) =>
          new Promise<Outcome<ChatTurn>>((resolve) =>
            signal?.addEventListener('abort', () => resolve(Outcomes.cancelled('chat'))),
          ),
      )
      const run = engine.processUtterance('rename it')
      await vi.waitFor(() => expect(complete).toHaveBeenCalled())

      engine.cancelTurn()
      await run

      expect(endings()).toEqual([TurnEndingKind.Cancelled])
    })
  })
})
