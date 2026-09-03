import { Attempt, Outcome } from '../shared/models/outcome'
import { ChatMessage } from './models/chat-message'
import { ChatTurn } from './models/chat-turn'
import { ToolCall } from './models/tool-call'

export interface TranscriptionProvider {
  // No signal, so an Attempt: a cancel discards the recording before it is sent.
  transcribe(audio: Blob, mimeType: string): Promise<Attempt<string>>
}

export interface ChatProvider {
  // The signal is optional so a caller with nothing to cancel stays unchanged.
  complete(
    messages: ChatMessage[],
    tools: ToolSchema[],
    signal?: AbortSignal,
  ): Promise<Outcome<ChatTurn>>
}

export { ChatMessage, ChatTurn, ToolCall }

export interface ToolSchema {
  name: string
  description: string
  parameters: Record<string, unknown>
}
