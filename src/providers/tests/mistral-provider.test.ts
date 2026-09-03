import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MistralProvider } from '../mistral-provider'
import { Outcomes } from '../../shared/models/outcome'
import { TOOL_SCHEMAS } from '../../engine/models/tool-schemas'
import { ChatMessage } from '../models/chat-message'

const abortError = (): Error => {
  const error = new Error('The operation was aborted')
  error.name = 'AbortError'
  return error
}

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('MistralProvider', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let provider: MistralProvider

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    provider = new MistralProvider('test-key', 'mistral-medium-latest')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('when transcribing', () => {
    it('returns transcript text when the transcription request succeeds', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ text: 'hello world' }))

      const outcome = await provider.transcribe(new Blob(['audio']), 'audio/webm')

      expect(outcome).toEqual(Outcomes.success('hello world'))
    })

    it('returns a transcription-step failure when the API responds non-2xx', async () => {
      fetchMock.mockResolvedValue(new Response('unauthorised', { status: 401 }))

      const outcome = await provider.transcribe(new Blob(['audio']), 'audio/webm')

      expect(outcome).toEqual(Outcomes.failure('transcription', 'API responded 401: unauthorised'))
    })

    it('returns a transcription-step failure when the request is abandoned', async () => {
      fetchMock.mockRejectedValue(abortError())

      const outcome = await provider.transcribe(new Blob(['audio']), 'audio/webm')

      expect(outcome).toEqual(Outcomes.failure('transcription', 'the request was abandoned'))
    })
  })

  describe('when completing chat', () => {
    it('maps tool_calls to ChatTurn toolCalls when the chat response contains them', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    id: 'c1',
                    function: { name: 'replace_text', arguments: '{"anchor_text":"a"}' },
                  },
                ],
              },
            },
          ],
        }),
      )

      const outcome = await provider.complete([ChatMessage.user('hi')], TOOL_SCHEMAS)

      expect(outcome.hasFailed()).toBe(false)
      if (!outcome.succeeded()) return
      const turn = outcome.value
      expect(turn.isToolCalls()).toBe(true)
      expect(turn.calls).toEqual([{ id: 'c1', name: 'replace_text', args: { anchor_text: 'a' } }])
    })

    it('maps content to ChatTurn text when the chat response is plain', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ choices: [{ message: { content: 'all done' } }] }))

      const outcome = await provider.complete([ChatMessage.user('hi')], TOOL_SCHEMAS)

      expect(outcome.hasFailed()).toBe(false)
      if (!outcome.succeeded()) return
      const turn = outcome.value
      expect(turn.isText()).toBe(true)
      expect(turn.content).toBe('all done')
    })

    it('returns a chat-step failure when the chat request rejects', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))

      const outcome = await provider.complete([ChatMessage.user('hi')], TOOL_SCHEMAS)

      expect(outcome).toEqual(Outcomes.failure('chat', 'request failed: Error: network down'))
    })

    it('passes no signal to fetch when none is given', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ choices: [{ message: { content: 'ok' } }] }))

      await provider.complete([ChatMessage.user('hi')], TOOL_SCHEMAS)

      expect(fetchMock.mock.calls[0][1].signal).toBeUndefined()
    })
  })

  describe('when the chat request is cancelled', () => {
    let controller: AbortController

    beforeEach(() => {
      controller = new AbortController()
    })

    it('passes the signal to fetch when one is given', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ choices: [{ message: { content: 'ok' } }] }))

      await provider.complete([ChatMessage.user('hi')], TOOL_SCHEMAS, controller.signal)

      expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal)
    })

    it('returns a cancelled outcome when the request is aborted', async () => {
      fetchMock.mockRejectedValue(abortError())

      const outcome = await provider.complete(
        [ChatMessage.user('hi')],
        TOOL_SCHEMAS,
        controller.signal,
      )

      expect(outcome).toEqual(Outcomes.cancelled('chat'))
    })

    it('reports an abort as not failed, so the panel does not call it an error', async () => {
      fetchMock.mockRejectedValue(abortError())

      const outcome = await provider.complete(
        [ChatMessage.user('hi')],
        TOOL_SCHEMAS,
        controller.signal,
      )

      expect(outcome.hasFailed()).toBe(false)
    })
  })
})
