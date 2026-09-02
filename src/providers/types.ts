import { Outcome } from '../shared/models/outcome'
import { ChatMessage } from './models/chat-message'
import { ChatTurn } from './models/chat-turn'
import { ToolCall } from './models/tool-call'

export interface TranscriptionProvider {
  transcribe(audio: Blob, mimeType: string): Promise<Outcome<string>>
}

export interface ChatProvider {
  complete(messages: ChatMessage[], tools: ToolSchema[]): Promise<Outcome<ChatTurn>>
}

export { ChatMessage, ChatTurn, ToolCall }

export interface ToolSchema {
  name: string
  description: string
  parameters: Record<string, unknown>
}
