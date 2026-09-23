import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { App } from 'obsidian'
import { EditEngine } from '../edit-engine'
import { Outcomes } from '../../shared/models/outcome'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { FakeVault } from '../../test-support/fake-vault'
import { ChatProvider } from '../../model/providers/types'
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

const FOUND = 'Quotes/roofing.md'

// A model told to answer through the tool complies when told and reverts a turn
// later, so the harness checks rather than asking the prompt again. Driven from
// the runner because the rule is about how a turn ends, not about one reply.
describe('ConversationTurnRunner answer correction', () => {
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let transcript: TranscriptRepository
  let engine: EditEngine
  let sessions: ReturnType<typeof aSession>

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
    const vault = new FakeVault().withNote(FOUND, 'the roofing quote came to 12k')
    sessions = aSession()
    engine = anEngine(
      { complete },
      {
        sessions,
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

  const aGrep = () => aToolCall('grep_notes', { pattern: 'roofing' })

  // The grep returns the note, so the turn has a path to cite from the step
  // after it.
  const searchesThenReplies = (...replies: string[]): void => {
    complete.mockResolvedValueOnce(Outcomes.success(aToolTurn(aGrep())))
    replies.forEach((reply) => complete.mockResolvedValueOnce(Outcomes.success(aTextTurn(reply))))
  }

  describe('when a search found notes and the reply names one uncited', () => {
    beforeEach(() => {
      searchesThenReplies(`The quote is in ${FOUND}`, `It is in [[Quotes/roofing|roofing]]`)
    })

    it('sends the reply back rather than ending the turn on it', async () => {
      await engine.processUtterance('what did roofing cost')

      expect(complete).toHaveBeenCalledTimes(3)
    })

    it('tells the model which path went unlinked', async () => {
      await engine.processUtterance('what did roofing cost')

      expect(sessions.chatHistory().map((message) => message.content)).toContain(
        `this reply names ${FOUND} without linking them; cite each as [[<path>|<name>]] so the reader can open it, and send the answer through answer_from_search`,
      )
    })
  })

  describe('when a search found notes and the reply cites them correctly', () => {
    it('still sends it back, since the answer belongs in answer_from_search', async () => {
      searchesThenReplies(
        `It is in [[Quotes/roofing|roofing]]`,
        `It is in [[Quotes/roofing|roofing]]`,
      )

      await engine.processUtterance('what did roofing cost')

      expect(sessions.chatHistory().map((message) => message.content)).toContain(
        'a search found notes this turn, so the answer goes through answer_from_search with every path it drew on in sources, not as a plain reply',
      )
    })
  })

  // Correcting twice would spend the budget arguing with a model that has
  // already declined once, and the reply is worth more to the user than the
  // steps refusing it again.
  describe('when the model replies in text a second time', () => {
    it('ends the turn on the second reply rather than correcting again', async () => {
      searchesThenReplies(`The quote is in ${FOUND}`, `Still ${FOUND}`)

      await engine.processUtterance('what did roofing cost')

      expect(endings()).toEqual([TurnEndingKind.Replied])
    })
  })

  // The failure this catches happens when a search found nothing, which is where
  // the citation rules stand aside, so it is driven through a grep that matched.
  describe('when the reply is a tool call written as text', () => {
    it('sends it back rather than publishing the raw call to the user', async () => {
      complete.mockResolvedValueOnce(
        Outcomes.success(aTextTurn('grep_notes{"pattern": "walk", "applicable_skills": []}')),
      )
      complete.mockResolvedValue(Outcomes.success(aTextTurn('Nothing covers that walk')))

      await engine.processUtterance('where did I walk')

      expect(sessions.chatHistory().map((message) => message.content)).toContain(
        'that reply was grep_notes written as text, not a tool call the harness can run: emit it as a tool call, or say in words what you found',
      )
    })

    it('ends the turn on the reply that followed the correction', async () => {
      complete.mockResolvedValueOnce(
        Outcomes.success(aTextTurn('grep_notes{"pattern": "walk", "applicable_skills": []}')),
      )
      complete.mockResolvedValue(Outcomes.success(aTextTurn('Nothing covers that walk')))

      await engine.processUtterance('where did I walk')

      expect(endings()).toEqual([TurnEndingKind.Replied])
    })
  })

  describe('when no search found a path', () => {
    it('ends the turn on the reply, since there is nothing to cite', async () => {
      complete.mockResolvedValue(Outcomes.success(aTextTurn('Nothing in the vault covers that')))

      await engine.processUtterance('what did roofing cost')

      expect(endings()).toEqual([TurnEndingKind.Replied])
    })

    it('leaves the history free of any correction', async () => {
      complete.mockResolvedValue(Outcomes.success(aTextTurn('Nothing in the vault covers that')))

      await engine.processUtterance('what did roofing cost')

      expect(complete).toHaveBeenCalledTimes(1)
    })
  })
})
