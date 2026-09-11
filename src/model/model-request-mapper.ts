import { ChatMessage } from './providers/types'
import { ModelRequest } from './model-request'
import { ModelRequestParts } from './model-request-parts'
import { SystemPrompt } from './prompt/system-prompt'
import { DateMessage } from './prompt/date-message'
import { NoNoteBoundMessage } from './prompt/no-note-bound-message'
import { NoteContextMessage } from './prompt/note-context-message'
import { Today } from './today'

// One turn's request as the messages that carry it. ModelService knows who to
// send them to; this knows what they are made of.
export class ModelRequestMapper {
  static toMessages(request: ModelRequest): ChatMessage[] {
    return ModelRequestMapper.toParts(request).asMessagesAround(request.chatHistory)
  }

  // Named rather than assembled inline, so ModelService can record what each
  // part said without rebuilding any of them.
  static toParts(request: ModelRequest): ModelRequestParts {
    return new ModelRequestParts(
      SystemPrompt.build(
        request.agentsMdChain,
        request.allowedCommands,
        request.skills,
        request.searchEnabled,
      ),
      // Today is read per call rather than per session, so a turn running past
      // midnight resolves against the day it is on.
      DateMessage.build(Today.of()),
      ModelRequestMapper.sessionTarget(request),
    )
  }

  private static sessionTarget(request: ModelRequest): ChatMessage {
    return request.note
      ? NoteContextMessage.build(request.note.details())
      : NoNoteBoundMessage.build(request.hasCommands(), request.searchEnabled)
  }
}
