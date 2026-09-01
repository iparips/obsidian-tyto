import { ChatMessage, ChatTurn, ToolCall, ToolSchema } from './types'

interface ApiToolCall {
  id: string
  function: { name: string; arguments: string }
}

export interface ApiMessage {
  content?: string | null
  tool_calls?: ApiToolCall[] | null
}

export class MistralMapping {
  static toApiMessage(message: ChatMessage): Record<string, unknown> {
    if ('toolCalls' in message)
      return {
        role: 'assistant',
        content: '',
        tool_calls: message.toolCalls.map(MistralMapping.toApiToolCall),
      }
    if (message.role === 'tool')
      return { role: 'tool', tool_call_id: message.toolCallId, content: message.content }
    return { role: message.role, content: message.content }
  }

  static toApiTool(tool: ToolSchema): Record<string, unknown> {
    return {
      type: 'function',
      function: { name: tool.name, description: tool.description, parameters: tool.parameters },
    }
  }

  static toChatTurn(message: ApiMessage): ChatTurn {
    if (message.tool_calls?.length)
      return ChatTurn.ofToolCalls(message.tool_calls.map(MistralMapping.toToolCall))
    return ChatTurn.ofText(typeof message.content === 'string' ? message.content : '')
  }

  static fileNameFor(mimeType: string): string {
    const extension = mimeType.split(';')[0].split('/')[1] ?? 'webm'
    return `utterance.${extension}`
  }

  private static toApiToolCall(call: ToolCall): ApiToolCall {
    return { id: call.id, function: { name: call.name, arguments: JSON.stringify(call.args) } }
  }

  private static toToolCall(call: ApiToolCall): ToolCall {
    return {
      id: call.id,
      name: call.function.name,
      args: MistralMapping.parseArgs(call.function.arguments),
    }
  }

  private static parseArgs(raw: string): Record<string, unknown> {
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
}
