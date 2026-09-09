import { ChatMessage } from './providers/types'
import { OpenNote } from '../engine/note-editing/open-note'
import { Skill } from '../skills/skill'
import { AgentsMdChain } from '../agents/agents-md-chain'

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
