import { ToolCall } from '../providers/types'
import { HarnessResult, Refusal, TurnState } from './harness-result'
import { ChoiceRequest } from './models/choice-request'
import { TurnStep } from './models/turn-step'

// Eight, because that is what a person reads without scrolling a phone drawer.
// Over it the call refuses rather than truncating: silently dropping the note
// the user wanted is the failure this replaces (FR15).
const MAX_CANDIDATES = 8

// What the model offers the user, checked before they see it. The choice itself
// belongs to the loop: this builds the shortlist and refuses the ones that
// cannot be offered.
export class ShortlistTool {
  // Filtered before the user sees it, so the model cannot route around the
  // seen-path guard by shortlisting a path it invented and having the pick
  // stand in as consent.
  static offer(call: ToolCall, turn: TurnState): HarnessResult {
    const offered = call.stringsArgument('paths')
    if (offered.length === 0) return Refusal.of('offer at least one path a search returned')
    const seen = offered.filter((path) => turn.seenPaths.includes(path))
    if (seen.length === 0) return Refusal.of(ShortlistTool.unsearchedMessage(offered))
    // After the filter, so dropping an invented path cannot push a valid
    // shortlist over the cap (FR15).
    if (seen.length > MAX_CANDIDATES) return Refusal.of(ShortlistTool.capMessage())
    return ShortlistTool.offering(seen, call.argument('purpose'))
  }

  // An unseen path is dropped rather than refusing the whole call, because a
  // model that shortlists four notes and misremembers one should still get its
  // pick.
  private static offering(candidates: readonly string[], purpose: string): HarnessResult {
    return {
      result: 'offered the notes to the user; their choice follows',
      choice: new ChoiceRequest(candidates, purpose),
      step: TurnStep.offered(candidates.length),
    }
  }

  private static unsearchedMessage(paths: readonly string[]): string {
    return `no search returned ${paths.join(', ')}; search before offering them`
  }

  private static capMessage(): string {
    return `offer at most ${MAX_CANDIDATES} notes; narrow your search first`
  }
}
