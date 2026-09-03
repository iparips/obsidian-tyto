import { PendingAnswer } from './pending-answer'
import { TurnCancellation } from './turn-cancellation'

// One question, asked of whoever supplied it. The engine awaits an answer
// without knowing that a panel button is what produces it (NFR5). The parking
// itself is PendingAnswer's, so a confirmation and a question share one
// mechanism (NFR6).
export class OpenApproval {
  // Per path rather than one flag: a turn that opens a second, different note
  // asks again, which keeps the open cap meaningful (FR12).
  private readonly approved = new Set<string>()

  constructor(private pending: PendingAnswer<string, boolean>) {}

  // The path asked about is the path from the vault root, so the user approves
  // a note rather than a title two notes could share (FR13).
  static of(
    ask: (path: string) => Promise<boolean>,
    cancellation = new TurnCancellation(),
  ): OpenApproval {
    return new OpenApproval(new PendingAnswer(ask, cancellation))
  }

  // Auto mode, and what a test constructs when the question is not what it is
  // exercising. The mode is a choice of collaborator, not a branch (NFR3).
  static granted(): OpenApproval {
    return OpenApproval.of(() => Promise.resolve(true))
  }

  // Granted once, held for the turn: a two-step instruction is approved before
  // its first step rather than again at the edit (FR12). A cancelled turn
  // declines, so the loop never stays parked (FR29).
  async grantFor(path: string): Promise<boolean> {
    if (this.approved.has(path)) return true
    const answer = await this.pending.awaiting(path, false)
    if (answer) this.approved.add(path)
    return answer
  }
}
