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

  static modelToolCalls(toolCalls: ToolCall[], content = ''): ChatMessage {
    return new ChatMessage('assistant', content, toolCalls, '')
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

  // A provider rejects an assistant message carrying neither words nor calls,
  // so one in the history makes every later request fail. Asked here rather
  // than at the provider, since it is a fact about the message.
  //
  // Assistant only: an empty tool result is still the answer to a call, and
  // dropping it would leave that call unanswered, which is rejected in turn.
  saysNothing(): boolean {
    return this.role === 'assistant' && this.content.trim() === '' && !this.hasToolCalls()
  }

  apiRole(): ChatRole {
    return this.role
  }
}
