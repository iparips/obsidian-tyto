import { ToolCall } from '../types'

// One model response: either a batch of tool calls to apply, or the text that
// ends the utterance. Built through the two factories, so the payload and the
// kind cannot disagree.
export class ChatTurn {
  private constructor(
    private readonly kind: 'toolCalls' | 'text',
    readonly calls: ToolCall[],
    readonly content: string,
  ) {}

  static ofToolCalls(calls: ToolCall[]): ChatTurn {
    return new ChatTurn('toolCalls', calls, '')
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
