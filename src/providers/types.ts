import { Outcome } from '../engine/outcome'
import { ChatTurn } from './chat-turn'

export interface TranscriptionProvider {
  transcribe(audio: Blob, mimeType: string): Promise<Outcome<string>>
}

export interface ChatProvider {
  complete(messages: ChatMessage[], tools: ToolSchema[]): Promise<Outcome<ChatTurn>>
}

export type ChatMessage =
  | { role: 'system' | 'user' | 'assistant'; content: string }
  | { role: 'assistant'; toolCalls: ToolCall[] }
  | { role: 'tool'; toolCallId: string; content: string }

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
}

export { ChatTurn }

export interface ToolSchema {
  name: string
  description: string
  parameters: Record<string, unknown>
}
