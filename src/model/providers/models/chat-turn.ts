import { ToolCall } from '../types'

// One model response: a batch of tool calls to apply, the text that ends the
// utterance, or both at once. Built through the two factories, so the payload
// and the kind cannot disagree.
export class ChatTurn {
  private constructor(
    private readonly kind: 'toolCalls' | 'text',
    readonly calls: ToolCall[],
    readonly content: string,
  ) {}

  // The content defaults to empty, so a caller naming calls alone keeps the
  // meaning it had before a reply could carry both.
  static ofToolCalls(calls: ToolCall[], content = ''): ChatTurn {
    return new ChatTurn('toolCalls', calls, content)
  }

  static ofText(content: string): ChatTurn {
    return new ChatTurn('text', [], content)
  }

  isToolCalls(): boolean {
    return this.kind === 'toolCalls'
  }

  isText(): boolean {
    return this.kind === 'text'
  }
}
