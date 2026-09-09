import { ChatMessage } from './providers/types'
import { HarnessReach } from './harness-reach'
import { ModelRequest } from './model-request'
import { OpenNote } from '../engine/note-editing/open-note'
import { PromptFactory } from './prompt-factory'
import { Today } from './today'

// One turn's request as the messages that carry it. ModelCaller knows who to
// send them to and what the harness allows; this knows what they are made of.
export class ModelRequestMapper {
  // Ordered by how stale a copy the history could hold: the rules first, then
  // the conversation, then what the model must not read off an earlier turn.
  static toMessages(request: ModelRequest, reach: HarnessReach): ChatMessage[] {
    return [
      ModelRequestMapper.standingRules(request, reach),
      ...request.chatHistory,
      // Today is read per call rather than per session, so a turn running past
      // midnight resolves against the day it is on.
      PromptFactory.date(Today.of()),
      // The skill names, on their own message, between the date and the note.
      // Null for a vault that defines none, so nothing empty is sent.
      PromptFactory.skillCatalogue(request.skills),
      ModelRequestMapper.highPriorityContext(request.note, reach), // included last
    ].filter((message): message is ChatMessage => message !== null)
  }

  private static standingRules(request: ModelRequest, reach: HarnessReach): ChatMessage {
    return PromptFactory.standingRules(
      request.skills.length > 0,
      request.agentsMdChain,
      reach.allowedCommands,
      reach.searchEnabled,
    )
  }

  private static highPriorityContext(note: OpenNote | null, reach: HarnessReach): ChatMessage {
    if (note) return PromptFactory.noteContext(note.details())
    return PromptFactory.unboundContext(reach.hasCommands(), reach.searchEnabled)
  }
}
