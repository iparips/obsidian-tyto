import { ChatMessage, ChatTurn, ToolCall, ToolSchema } from './types'

interface ApiToolCall {
  id: string
  function: { name: string; arguments: string }
}

export interface ApiMessage {
  content?: string | null
  tool_calls?: ApiToolCall[] | null
}

export class MistralMapper {
  static toApiMessage(message: ChatMessage): Record<string, unknown> {
    // The content travels with the calls rather than being hardcoded empty, so
    // the model reads its own last reply in full on the next step.
    if (message.hasToolCalls())
      return {
        role: 'assistant',
        content: message.content,
        tool_calls: message.toolCalls.map(MistralMapper.toApiToolCall),
      }
    if (message.isToolResult())
      return { role: 'tool', tool_call_id: message.toolCallId, content: message.content }
    return { role: message.apiRole(), content: message.content }
  }

  static toApiTool(tool: ToolSchema): Record<string, unknown> {
    return {
      type: 'function',
      function: { name: tool.name, description: tool.description, parameters: tool.parameters },
    }
  }

  static toChatTurn(message: ApiMessage): ChatTurn {
    if (message.tool_calls?.length)
      return ChatTurn.ofToolCalls(
        message.tool_calls.map(MistralMapper.toToolCall),
        MistralMapper.contentOf(message),
      )
    return ChatTurn.ofText(MistralMapper.contentOf(message))
  }

  static fileNameFor(mimeType: string): string {
    const extension = mimeType.split(';')[0].split('/')[1] ?? 'webm'
    return `utterance.${extension}`
  }

  private static contentOf(message: ApiMessage): string {
    return typeof message.content === 'string' ? message.content : ''
  }

  private static toApiToolCall(call: ToolCall): ApiToolCall {
    return { id: call.id, function: { name: call.name, arguments: JSON.stringify(call.args) } }
  }

  private static toToolCall(call: ApiToolCall): ToolCall {
    return new ToolCall(
      call.id,
      call.function.name,
      MistralMapper.parseArgs(call.function.arguments),
    )
  }

  private static parseArgs(raw: string): Record<string, unknown> {
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return {}
    }
  }
}
