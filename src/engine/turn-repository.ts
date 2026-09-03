import { EditorPosition } from 'obsidian'
import { OpenNote } from './models/open-note'
import { AgentsMdChain } from '../agents/agents-md-chain'
import { ResolvedNote } from './models/resolved-note'
import { TurnBudget } from './models/turn-budget'
import { Skill } from '../skills/skill'

// What one turn holds, built at its start and discarded with it. Separate from
// SessionRepository because an editor handle cannot outlive the turn: kept
// across turns it goes stale silently, whereas a path re-resolves and fails
// loudly.
export class TurnRepository {
  private lastEditEnd: EditorPosition | null = null
  private unwritablePath: string | null = null

  constructor(
    private resolved: ResolvedNote | null,
    private readonly vaultSkills: readonly Skill[] = [],
    readonly budget: TurnBudget = new TurnBudget(),
  ) {}

  // Null while the session is unbound, which is a turn that can search but not
  // write.
  targetNote(): OpenNote | null {
    return this.resolved?.note ?? null
  }

  isBound(): boolean {
    return this.resolved !== null
  }

  // Empty when unbound: a chain resolves from a note's folders, and there is no
  // note.
  agentMdChain(): AgentsMdChain {
    return this.resolved?.instructions ?? new AgentsMdChain()
  }

  skills(): readonly Skill[] {
    return this.vaultSkills
  }

  skillNamed(name: string): Skill | undefined {
    return this.vaultSkills.find((candidate) => candidate.name === name)
  }

  editEnd(): EditorPosition | null {
    return this.lastEditEnd
  }

  retargetTo(resolved: ResolvedNote): void {
    this.resolved = resolved
    this.unwritablePath = null
  }

  // The session moved to a note this turn cannot resolve, so the note it still
  // holds is no longer the target and must not be written to.
  cannotWriteTo(path: string): void {
    this.unwritablePath = path
  }

  unwritableNote(): string | null {
    return this.unwritablePath
  }

  recordEdit(editedTo: EditorPosition | undefined): void {
    this.lastEditEnd = editedTo ?? this.lastEditEnd
  }
}
