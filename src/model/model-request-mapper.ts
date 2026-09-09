import { ChatMessage } from './providers/types'
import { ModelRequest } from './model-request'
import { SystemPrompt } from './prompt/system-prompt'
import { DateMessage } from './prompt/date-message'
import { NoNoteBoundMessage } from './prompt/no-note-bound-message'
import { NoteContextMessage } from './prompt/note-context-message'
import { Today } from './today'

// One turn's request as the messages that carry it. ModelService knows who to
// send them to; this knows what they are made of.
export class ModelRequestMapper {
  // Ordered by how stale a copy the history could hold: the system prompt
  // first, then the conversation, then what the model must not read off an
  // earlier turn.
  static toMessages(request: ModelRequest): ChatMessage[] {
    const systemPrompt = SystemPrompt.build(
      request.agentsMdChain,
      request.allowedCommands,
      request.skills,
      request.searchEnabled,
    )

    return [
      systemPrompt,
      ...request.chatHistory,
      // Today is read per call rather than per session, so a turn running past
      // midnight resolves against the day it is on.
      DateMessage.build(Today.of()),
      ModelRequestMapper.sessionTarget(request), // included last
    ]
  }

  private static sessionTarget(request: ModelRequest): ChatMessage {
    return request.note
      ? NoteContextMessage.build(request.note.details())
      : NoNoteBoundMessage.build(request.hasCommands(), request.searchEnabled)
  }
}
