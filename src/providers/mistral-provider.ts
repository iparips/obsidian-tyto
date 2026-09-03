import {
  Attempt,
  Cancelled,
  Failure,
  FailureStep,
  Outcome,
  Outcomes,
} from '../shared/models/outcome'
import { ApiMessage, MistralMapper } from './mistral-mapper'
import { ChatMessage, ChatProvider, ChatTurn, ToolSchema, TranscriptionProvider } from './types'

const API_BASE = 'https://api.mistral.ai/v1'
const TRANSCRIBE_MODEL = 'voxtral-mini-latest'

export class MistralProvider implements TranscriptionProvider, ChatProvider {
  constructor(
    private apiKey: string,
    private editModel: string,
  ) {}

  async transcribe(audio: Blob, mimeType: string): Promise<Attempt<string>> {
    const form = new FormData()
    form.append('file', audio, MistralMapper.fileNameFor(mimeType))
    form.append('model', TRANSCRIBE_MODEL)
    // No signal is passed, so the shared request never comes back cancelled here.
    const body = await this.request('transcription', '/audio/transcriptions', { body: form })
    if (!body.succeeded()) return Outcomes.failure('transcription', MistralProvider.reason(body))
    const data = body.value as { text?: string }
    return Outcomes.success(data.text ?? '')
  }

  async complete(
    messages: ChatMessage[],
    tools: ToolSchema[],
    signal?: AbortSignal,
  ): Promise<Outcome<ChatTurn>> {
    const payload = {
      model: this.editModel,
      messages: messages.map(MistralMapper.toApiMessage),
      tools: tools.map(MistralMapper.toApiTool),
      tool_choice: 'auto',
    }
    const body = await this.request('chat', '/chat/completions', {
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
      signal,
    })
    if (!body.succeeded()) return Outcomes.relay(body)
    const data = body.value as { choices?: { message?: ApiMessage }[] }
    return Outcomes.success(MistralMapper.toChatTurn(data.choices?.[0]?.message ?? {}))
  }

  private async request(
    step: FailureStep,
    path: string,
    init: { body: BodyInit; headers?: Record<string, string>; signal?: AbortSignal },
  ): Promise<Outcome<unknown>> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}`, ...init.headers },
        body: init.body,
        signal: init.signal,
      })
      return await this.parseResponse(step, response)
    } catch (error) {
      // An abort is the user stopping the turn, not the request failing, so it
      // is reported as its own outcome rather than as a chat failure.
      if (MistralProvider.wasAborted(error)) return Outcomes.cancelled(step)
      return Outcomes.failure(step, `request failed: ${String(error)}`)
    }
  }

  private static wasAborted(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError'
  }

  private static reason(outcome: Failure<unknown> | Cancelled<unknown>): string {
    return outcome.hasFailed() ? outcome.message : 'the request was abandoned'
  }

  private async parseResponse(step: FailureStep, response: Response): Promise<Outcome<unknown>> {
    if (!response.ok) {
      const snippet = (await response.text()).slice(0, 200)
      return Outcomes.failure(step, `API responded ${response.status}: ${snippet}`)
    }
    return Outcomes.success(await response.json())
  }
}
