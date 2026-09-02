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

  constructor(
    private resolved: ResolvedNote,
    private readonly vaultSkills: readonly Skill[] = [],
    readonly budget: TurnBudget = new TurnBudget(),
  ) {}

  targetNote(): OpenNote {
    return this.resolved.note
  }

  agentMdChain(): AgentsMdChain {
    return this.resolved.instructions
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
  }

  recordEdit(editedTo: EditorPosition | undefined): void {
    this.lastEditEnd = editedTo ?? this.lastEditEnd
  }
}
