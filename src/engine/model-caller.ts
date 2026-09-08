import { ChatMessage, ChatProvider } from '../providers/types'
import { ChatTurn } from '../providers/models/chat-turn'
import { Outcome } from '../shared/models/outcome'
import { PromptFactory } from './prompting/prompt-factory'
import { Today } from './prompting/today'
import { OpenNote } from './note-editing/open-note'
import { Skill } from '../skills/skill'
import { AgentsMdChain } from '../agents/agents-md-chain'
import { HarnessToolsService } from './tools/harness-tools-service'

// What one turn tells the model, and what the model may call back. The loop
// knows when to ask; this knows what the asking is made of.
export class ModelCaller {
  constructor(
    private modelProvider: ChatProvider,
    private harnessToolsService: HarnessToolsService,
  ) {}

  // Ordered by how stale a copy the history could hold: the rules first, then
  // the conversation, then what the model must not read off an earlier turn.
  async ask(request: ModelRequest): Promise<Outcome<ChatTurn>> {
    return this.modelProvider.complete(
      this.messagesFor(request),
      this.harnessToolsService.schemas(request.skills.length > 0),
      request.abortSignal,
    )
  }

  private messagesFor(request: ModelRequest): ChatMessage[] {
    return [
      this.standingRules(request),
      ...request.chatHistory,
      // Today is read per call rather than per session, so a turn running past
      // midnight resolves against the day it is on.
      PromptFactory.dateAndSkills(Today.of(), request.skills),
      this.finalContext(request.note),
    ]
  }

  private standingRules(request: ModelRequest): ChatMessage {
    return PromptFactory.standingRules(
      request.skills,
      request.agentsMdChain,
      this.harnessToolsService.allowedCommands(),
      this.harnessToolsService.hasSearchEnabled(),
    )
  }

  private finalContext(note: OpenNote | null): ChatMessage {
    if (note) return PromptFactory.noteContext(note.details())
    return PromptFactory.unboundContext(
      this.harnessToolsService.hasWhitelistedCommands(),
      this.harnessToolsService.hasSearchEnabled(),
    )
  }
}

// What the turn supplies for one call. A value, so the five arguments travel
// together rather than as a signature every caller has to keep in order.
export class ModelRequest {
  constructor(
    readonly note: OpenNote | null,
    readonly skills: readonly Skill[],
    readonly agentsMdChain: AgentsMdChain,
    readonly chatHistory: readonly ChatMessage[],
    readonly abortSignal: AbortSignal,
  ) {}
}
