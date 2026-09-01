import { FailureStep, Outcome, Outcomes } from '../engine/outcome'
import { ApiMessage, MistralMapping } from './mistral-mapping'
import { ChatMessage, ChatProvider, ChatTurn, ToolSchema, TranscriptionProvider } from './types'

const API_BASE = 'https://api.mistral.ai/v1'
const TRANSCRIBE_MODEL = 'voxtral-mini-latest'

export class MistralProvider implements TranscriptionProvider, ChatProvider {
  constructor(
    private apiKey: string,
    private editModel: string,
  ) {}

  async transcribe(audio: Blob, mimeType: string): Promise<Outcome<string>> {
    const form = new FormData()
    form.append('file', audio, MistralMapping.fileNameFor(mimeType))
    form.append('model', TRANSCRIBE_MODEL)
    const body = await this.request('transcription', '/audio/transcriptions', { body: form })
    if (body.hasFailed()) return Outcomes.failure(body.step, body.message)
    const data = body.value as { text?: string }
    return Outcomes.success(data.text ?? '')
  }

  async complete(messages: ChatMessage[], tools: ToolSchema[]): Promise<Outcome<ChatTurn>> {
    const payload = {
      model: this.editModel,
      messages: messages.map(MistralMapping.toApiMessage),
      tools: tools.map(MistralMapping.toApiTool),
      tool_choice: 'auto',
    }
    const body = await this.request('chat', '/chat/completions', {
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })
    if (body.hasFailed()) return Outcomes.failure(body.step, body.message)
    const data = body.value as { choices?: { message?: ApiMessage }[] }
    return Outcomes.success(MistralMapping.toChatTurn(data.choices?.[0]?.message ?? {}))
  }

  private async request(
    step: FailureStep,
    path: string,
    init: { body: BodyInit; headers?: Record<string, string> },
  ): Promise<Outcome<unknown>> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}`, ...init.headers },
        body: init.body,
      })
      return await this.parseResponse(step, response)
    } catch (error) {
      return Outcomes.failure(step, `request failed: ${String(error)}`)
    }
  }

  private async parseResponse(step: FailureStep, response: Response): Promise<Outcome<unknown>> {
    if (!response.ok) {
      const snippet = (await response.text()).slice(0, 200)
      return Outcomes.failure(step, `API responded ${response.status}: ${snippet}`)
    }
    return Outcomes.success(await response.json())
  }
}
