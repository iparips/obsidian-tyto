import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { EditEngine } from '../edit-engine'
import { Outcome, Outcomes } from '../../shared/models/outcome'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { ChatProvider } from '../../model/providers/types'
import { ChatTurn } from '../../model/providers/models/chat-turn'
import { aSession, aTextTurn, aToolCall, aToolTurn, anEngine } from '../../test-support/builders'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { TranscriptRepository } from '../../session/transcript/transcript-repository'
import { TurnEndingKind } from '../turn/turn-ending-kind'

// TurnOutcomes builds exhausted and stuck as the same chat failure, so the panel
// shows one message for both. Only the runner knows which it was, and a
// transcript that could not tell them apart would be read as the wrong failure.
describe('ConversationTurnRunner endings', () => {
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let transcript: TranscriptRepository
  let engine: EditEngine

  beforeEach(() => {
    vi.clearAllMocks()
    complete = vi.fn()
    transcript = new TranscriptRepository()
    engine = anEngine(
      { complete },
      {
        sessions: aSession(),
        noteLocator: new FakeNoteLocator().withOpenNote('note.md', new FakeEditor('# Budget')),
        agentsMdRepository: new AgentsMdRepository(new FakeAdapter().asAdapter()),
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
