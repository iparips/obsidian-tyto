import { ToolCall } from '../types'

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool'

// One entry in the conversation sent to the model. Built through the factories,
// so a role always carries the payload that belongs to it: only a tool result
// has a call id, and only an assistant turn has tool calls.
export class ChatMessage {
  private constructor(
    private readonly role: ChatRole,
    readonly content: string,
    readonly toolCalls: ToolCall[],
    readonly toolCallId: string,
  ) {}

  static system(content: string): ChatMessage {
    return new ChatMessage('system', content, [], '')
  }

  static user(content: string): ChatMessage {
    return new ChatMessage('user', content, [], '')
  }

  static model(content: string): ChatMessage {
    return new ChatMessage('assistant', content, [], '')
  }

  static modelToolCalls(toolCalls: ToolCall[]): ChatMessage {
    return new ChatMessage('assistant', '', toolCalls, '')
  }

  static toolCallResult(toolCallId: string, content: string): ChatMessage {
    return new ChatMessage('tool', content, [], toolCallId)
  }

  isSystem(): boolean {
    return this.role === 'system'
  }

  isUser(): boolean {
    return this.role === 'user'
  }

  isToolResult(): boolean {
    return this.role === 'tool'
  }

  hasToolCalls(): boolean {
    return this.toolCalls.length > 0
  }

  apiRole(): ChatRole {
    return this.role
  }
}
