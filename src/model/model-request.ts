import { ChatMessage } from './providers/types'
import { AllowedObsidianCommand } from '../commands/models/allowed-obsidian-command'
import { NoteDetails } from '../engine/note-editing/note-details'
import { Skill } from '../skills/skill'
import { AgentsMdChain } from '../agents/agents-md-chain'

// What the messages of one call are made of. A value, so the arguments travel
// together rather than as a signature every caller has to keep in order.
// The tool schemas and the abort signal are not here: they are what the
// provider call takes alongside the messages, not what the messages say.
export class ModelRequest {
  constructor(
    readonly note: NoteDetails | null,
    readonly skills: readonly Skill[],
    readonly agentsMdChain: AgentsMdChain,
    readonly chatHistory: readonly ChatMessage[],
    readonly allowedCommands: readonly AllowedObsidianCommand[],
    readonly searchEnabled: boolean,
    // Which turn of the session this is. Carried so the note context can say
    // it, which is what lets the model read an edit result's turn number as
    // recency rather than as a bare label.
    readonly turnNumber: number = 1,
  ) {}

  hasCommands(): boolean {
    return this.allowedCommands.length > 0
  }
}
