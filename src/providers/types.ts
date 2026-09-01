import { Outcome } from '../engine/outcome'
import { ChatMessage } from './chat-message'
import { ChatTurn } from './chat-turn'

export interface TranscriptionProvider {
  transcribe(audio: Blob, mimeType: string): Promise<Outcome<string>>
}

export interface ChatProvider {
  complete(messages: ChatMessage[], tools: ToolSchema[]): Promise<Outcome<ChatTurn>>
}

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
}

export { ChatMessage, ChatTurn }

export interface ToolSchema {
  name: string
  description: string
  parameters: Record<string, unknown>
}
