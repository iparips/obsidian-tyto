import { AgentsMdFile } from './agents-md-file'
import { AgentsMdChain } from './agents-md-chain'

// A safety rail against a pathological vault, not a routine constraint: roughly
// 10,000 tokens, under 8% of the edit model's context window.
const MAX_CHARACTERS = 40_000

// Fills from the nearest folder outward, so a cap that fires drops the furthest
// files rather than the ones the user most meant to apply.
export class ChainBudget {
  static apply(rootFirst: readonly AgentsMdFile[]): AgentsMdChain {
    const kept: AgentsMdFile[] = []
    let total = 0
    ;[...rootFirst].reverse().forEach((file) => {
      if (total + file.size() > MAX_CHARACTERS) return
      total += file.size()
      kept.push(file)
    })
    return new AgentsMdChain(kept.reverse(), ChainBudget.dropped(rootFirst, kept))
  }

  private static dropped(
    rootFirst: readonly AgentsMdFile[],
    kept: readonly AgentsMdFile[],
  ): AgentsMdFile[] {
    return rootFirst.filter((file) => !kept.includes(file))
  }
}
