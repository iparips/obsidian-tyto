import { ChatMessage, ChatRole } from '../../model/providers/models/chat-message'
import { ToolCall } from '../../model/providers/models/tool-call'
import { Entry } from './panel-state'

// Bumped when a field changes meaning. A record from another version is
// discarded rather than migrated (FR9).
export const STORED_SESSION_VERSION = 1

// Plain data, because it crosses a file boundary: a class with methods would
// need reviving, and every field here is already a string or a list of them.
export interface StoredSession {
  version: number
  // Null for an unbound session, which is a session that can still search.
  targetPath: string | null
  messages: StoredMessage[]
  entries: Entry[]
  // Epoch milliseconds, written when the turn that produced this record ended,
  // so a restore can say how old the conversation it brought back is. Optional
  // because a record written before this field existed has none, which costs a
  // stamp rather than the session: adding a field changes no existing field's
  // meaning, so the version does not move.
  writtenAt?: number
}

// ChatMessage is a class with a private constructor and five factories, so the
// record holds its four fields and a factory rebuilds it from them.
export interface StoredMessage {
  role: ChatRole
  content: string
  toolCalls: { id: string; name: string; args: Record<string, unknown> }[]
  toolCallId: string
}

// The two mappings ChatMessage needs, kept together so a field added to one is
// read back by the other.
export class StoredMessages {
  static of(message: ChatMessage): StoredMessage {
    return {
      role: message.apiRole(),
      content: message.content,
      toolCalls: message.toolCalls.map((call) => ({
        id: call.id,
        name: call.name,
        args: call.args,
      })),
      toolCallId: message.toolCallId,
    }
  }

  // Read back through the factories, picking one off the role: the constructor
  // is private and must stay so.
  static toMessage(stored: StoredMessage): ChatMessage {
    if (stored.role === 'tool') return ChatMessage.toolCallResult(stored.toolCallId, stored.content)
    if (stored.role === 'assistant') return StoredMessages.assistant(stored)
    if (stored.role === 'system') return ChatMessage.system(stored.content)
    return ChatMessage.user(stored.content)
  }

  private static assistant(stored: StoredMessage): ChatMessage {
    if (stored.toolCalls.length === 0) return ChatMessage.model(stored.content)
    return ChatMessage.modelToolCalls(
      stored.toolCalls.map((call) => new ToolCall(call.id, call.name, call.args)),
    )
  }
}
