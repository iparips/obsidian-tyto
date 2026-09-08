import { ToolCall } from '../../providers/types'
import { HarnessResult, Refusal, TurnState } from './harness-result'
import { ChoiceResult } from './harness-results'
import { ChoiceRequest } from './choice-request'
import { TurnStep } from '../turn-step'

// Eight, because that is what a person reads without scrolling a phone drawer.
// Over it the call refuses rather than truncating: silently dropping the note
// the user wanted is the failure this replaces (FR15).
const MAX_CANDIDATES = 8

// What the model offers the user, checked before they see it. The choice itself
// belongs to the loop: this builds the shortlist and refuses the ones that
// cannot be offered.
export class NotePathsShortlistTool {
  // Filtered before the user sees it, so the model cannot route around the
  // seen-path guard by shortlisting a path it invented and having the pick
  // stand in as consent.
  static offerPaths(call: ToolCall, turn: TurnState): HarnessResult {
    const pathsToOffer = call.stringsArgument('paths')
    if (pathsToOffer.length === 0) return Refusal.of('offer at least one path a search returned')
    const pathsThatHaveBeenSeenInThisSession = pathsToOffer.filter((path) =>
      turn.pathsReturnedByVault.includes(path),
    )
    if (pathsThatHaveBeenSeenInThisSession.length === 0)
      return Refusal.of(NotePathsShortlistTool.doNotOfferUnseenPathsMessage(pathsToOffer))
    if (pathsThatHaveBeenSeenInThisSession.length > MAX_CANDIDATES)
      return Refusal.of(NotePathsShortlistTool.capMessage())
    return NotePathsShortlistTool.pathsOffering(
      pathsThatHaveBeenSeenInThisSession,
      call.argument('purpose'),
    )
  }

  // An unseen path is dropped rather than refusing the whole call, because a
  // model that shortlists four notes and misremembers one should still get its
  // pick.
  private static pathsOffering(candidates: readonly string[], purpose: string): HarnessResult {
    return new ChoiceResult(
      'offered the notes to the user; their choice follows',
      new ChoiceRequest(candidates, purpose),
      TurnStep.offered(candidates.length),
    )
  }

  private static doNotOfferUnseenPathsMessage(paths: readonly string[]): string {
    return `no search returned ${paths.join(', ')}; search before offering them`
  }

  private static capMessage(): string {
    return `offer at most ${MAX_CANDIDATES} notes; narrow your search first`
  }
}
