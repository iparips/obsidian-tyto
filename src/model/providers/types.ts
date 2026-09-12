import { Attempt, Outcome } from '../../shared/models/outcome'
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
  parameters: ToolParameters
}

// The JSON schema one tool takes. Named rather than Record<string, unknown>
// because the catalogue adds a property and a required name to it, which a bag
// of unknowns cannot express.
export interface ToolParameters {
  type: string
  properties: Record<string, unknown>
  required: string[]
}
