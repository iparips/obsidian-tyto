import { ModelRequest } from '../model-request'
import { ModelRequestParts } from './model-request-parts'
import { SystemPrompt } from './system-prompt'
import { DateMessage } from './date-message'
import { NoNoteBoundMessage } from './no-note-bound-message'
import { NoteContextMessage } from './note-context-message'
import { Today } from '../today'
import { ChatMessage } from '../providers/types'

// Re-exported so a caller reaching the factory reaches what it returns through
// the same entry, rather than into the folder behind it.
export { ModelRequestParts } from './model-request-parts'

// One turn's request as the messages that carry it. ModelService knows who to
// send them to; this knows what they are made of.
export class PromptFactory {
  // Named parts rather than a flat list, so ModelService can record what each
  // part said without rebuilding any of them.
  static build(request: ModelRequest): ModelRequestParts {
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
      PromptFactory.sessionTarget(request),
    )
  }

  private static sessionTarget(request: ModelRequest): ChatMessage {
    return request.note
      ? NoteContextMessage.build(request.note, request.turnNumber)
      : NoNoteBoundMessage.build(request.hasCommands(), request.searchEnabled)
  }
}
