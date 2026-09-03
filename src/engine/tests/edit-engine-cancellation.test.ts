import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { EditEngine } from '../edit-engine'
import { Outcome, Outcomes } from '../../shared/models/outcome'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { ChatProvider, ChatMessage } from '../../providers/types'
import { ChatTurn } from '../../providers/models/chat-turn'
import { aSession, aTextTurn, aToolCall, aToolTurn, anEngine } from '../../test-support/builders'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { SessionRepository } from '../../session/session-repository'

describe('EditEngine cancellation', () => {
  let editor: FakeEditor
  let sessions: SessionRepository
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let engine: EditEngine

  beforeEach(() => {
    vi.clearAllMocks()
    editor = new FakeEditor('# Budget\n\nbody')
    sessions = aSession()
    complete = vi.fn()
    engine = anEngine(
      { complete },
      {
        sessions,
        noteLocator: new FakeNoteLocator().withOpenNote('note.md', editor),
        agentsMdRepository: new AgentsMdRepository(new FakeAdapter().asAdapter()),
        progress: TurnProgressPublisher.silent(),
      },
    )
  })

  const toolResults = () =>
    sessions.chatHistory().filter((message: ChatMessage) => message.isToolResult())

  // The provider aborts once the signal it was handed fires, which is what a
  // real cancel does to a request in flight.
  const abortsOnCancel = () =>
    complete.mockImplementation(
      (_messages, _tools, signal) =>
        new Promise<Outcome<ChatTurn>>((resolve) =>
          signal?.addEventListener('abort', () => resolve(Outcomes.cancelled('chat'))),
        ),
    )

  const anEdit = () =>
    aToolCall('replace_text', { anchor_text: '# Budget', replacement: '# Costs' })

  describe('when the model request is cancelled in flight', () => {
    beforeEach(() => {
      abortsOnCancel()
    })

    it('returns a cancelled outcome when the turn is cancelled', async () => {
      const run = engine.processUtterance('rename it')
      await vi.waitFor(() => expect(complete).toHaveBeenCalled())

      engine.cancelTurn()

      expect(await run).toEqual(Outcomes.cancelled('chat', []))
    })

    it('reports itself cancelled rather than failed, so the panel says so', async () => {
      const run = engine.processUtterance('rename it')
      await vi.waitFor(() => expect(complete).toHaveBeenCalled())

      engine.cancelTurn()

      expect((await run).hasFailed()).toBe(false)
    })

    it('records the cancellation in the chat history, so the next turn sees it', async () => {
      const run = engine.processUtterance('rename it')
      await vi.waitFor(() => expect(complete).toHaveBeenCalled())

      engine.cancelTurn()
      await run

      expect(sessions.chatHistory().at(-1)).toMatchObject({
        content: 'The user stopped this turn. Nothing was changed.',
      })
    })

    it('leaves the session on the note it was on when cancelled', async () => {
      const run = engine.processUtterance('rename it')
      await vi.waitFor(() => expect(complete).toHaveBeenCalled())

      engine.cancelTurn()
      await run

      expect(sessions.targetNote()).toBe('note.md')
    })

    it('releases the utterance queue, so a later utterance runs', async () => {
      const run = engine.processUtterance('rename it')
      await vi.waitFor(() => expect(complete).toHaveBeenCalled())
      engine.cancelTurn()
      await run
      complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))

      const second = await engine.processUtterance('try again')

      expect(second).toEqual(Outcomes.success('done'))
    })
  })

  describe('when the turn had already edited the note', () => {
    beforeEach(() => {
      complete
        .mockResolvedValueOnce(Outcomes.success(aToolTurn(anEdit())))
        .mockImplementationOnce(
          (_messages, _tools, signal) =>
            new Promise<Outcome<ChatTurn>>((resolve) =>
              signal?.addEventListener('abort', () => resolve(Outcomes.cancelled('chat'))),
            ),
        )
    })

    it('names the note it wrote when cancelled after an edit', async () => {
      const run = engine.processUtterance('rename it')
      await vi.waitFor(() => expect(complete).toHaveBeenCalledTimes(2))

      engine.cancelTurn()

      expect(await run).toEqual(Outcomes.cancelled('chat', ['note.md']))
    })

    it('keeps the edit the turn applied before it stopped', async () => {
      const run = engine.processUtterance('rename it')
      await vi.waitFor(() => expect(complete).toHaveBeenCalledTimes(2))

      engine.cancelTurn()
      await run

      expect(editor.content).toBe('# Costs\n\nbody')
    })

    it('names the note in the chat history, so the next turn knows what changed', async () => {
      const run = engine.processUtterance('rename it')
      await vi.waitFor(() => expect(complete).toHaveBeenCalledTimes(2))

      engine.cancelTurn()
      await run

      expect(sessions.chatHistory().at(-1)).toMatchObject({
        content: 'The user stopped this turn. Already changed: note.md.',
      })
    })
  })

  describe('when a cancel lands before the tool calls run', () => {
    // Cancelled as the model's answer arrives, so both calls reach a dispatcher
    // that has already been told to stop.
    beforeEach(() => {
      complete.mockImplementationOnce(async () => {
        const answer = Outcomes.success(
          aToolTurn(
            anEdit(),
            aToolCall('insert_at', { location: 'note_end', content: '\n- item' }),
          ),
        )
        engine.cancelTurn()
        return answer
      })
    })

    it('runs no tool call once the user has cancelled', async () => {
      await engine.processUtterance('rename and add')

      expect(editor.content).toBe('# Budget\n\nbody')
    })

    it('answers every tool call, so the history stays well formed', async () => {
      await engine.processUtterance('rename and add')

      expect(toolResults()).toHaveLength(2)
    })

    it('says the call did not run when the turn was already cancelled', async () => {
      await engine.processUtterance('rename and add')

      expect(toolResults()[0]).toMatchObject({
        content: 'the user stopped the turn; this call did not run',
      })
    })

    it('runs no further model call once the user has cancelled', async () => {
      await engine.processUtterance('rename and add')

      expect(complete).toHaveBeenCalledTimes(1)
    })
  })

  describe('when nothing cancels the turn', () => {
    it('completes normally, unchanged from today', async () => {
      complete.mockResolvedValue(Outcomes.success(aTextTurn('Nothing to do')))

      const outcome = await engine.processUtterance('hello')

      expect(outcome).toEqual(Outcomes.success('Nothing to do'))
    })

    it('ignores a cancel that arrives after the turn has finished', async () => {
      complete.mockResolvedValue(Outcomes.success(aTextTurn('Nothing to do')))
      await engine.processUtterance('hello')

      engine.cancelTurn()

      expect(sessions.chatHistory().at(-1)).toMatchObject({ content: 'Nothing to do' })
    })
  })
})
