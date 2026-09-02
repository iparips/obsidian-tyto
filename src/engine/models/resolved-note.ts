import { OpenNote } from './open-note'
import { AgentsMdChain } from '../../agents/agents-md-chain'

// The target note, made writable: the editor showing it and the chain its
// folders state. The two travel together because a note and the instructions
// that govern it must never come from different folders.
export class ResolvedNote {
  constructor(
    readonly note: OpenNote,
    readonly instructions: AgentsMdChain,
  ) {}
}
