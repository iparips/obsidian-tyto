import { ChatMessage } from './providers/types'
import { ModelRequest } from './model-request'
import { PromptFactory } from './prompt-factory'
import { Today } from './today'

// One turn's request as the messages that carry it. ModelService knows who to
// send them to; this knows what they are made of.
export class ModelRequestMapper {
  // Ordered by how stale a copy the history could hold: the rules first, then
  // the conversation, then what the model must not read off an earlier turn.
  static toMessages(request: ModelRequest): ChatMessage[] {
    return [
      ModelRequestMapper.standingRules(request),
      ...request.chatHistory,
      // Today is read per call rather than per session, so a turn running past
      // midnight resolves against the day it is on.
      PromptFactory.date(Today.of()),
      // The skill names, on their own message, between the date and the note.
      // Null for a vault that defines none, so nothing empty is sent.
      PromptFactory.skillCatalogue(request.skills),
      ModelRequestMapper.highPriorityContext(request), // included last
    ].filter((message): message is ChatMessage => message !== null)
  }

  private static standingRules(request: ModelRequest): ChatMessage {
    return PromptFactory.standingRules(
      request.skills.length > 0,
      request.agentsMdChain,
      request.allowedCommands,
      request.searchEnabled,
    )
  }

  private static highPriorityContext(request: ModelRequest): ChatMessage {
    if (request.note) return PromptFactory.noteContext(request.note.details())
    return PromptFactory.unboundContext(request.hasCommands(), request.searchEnabled)
  }
}
