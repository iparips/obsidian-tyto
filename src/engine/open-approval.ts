import { ApprovalRepository } from '../session/approval-repository'
import { PendingAnswer } from './pending-answer'
import { TurnCancellation } from './turn-cancellation'

// One question, asked of whoever supplied it. The engine awaits an answer
// without knowing that a panel button is what produces it (NFR5). The parking
// itself is PendingAnswer's, so a confirmation and a question share one
// mechanism (NFR6).
export class OpenApproval {
  constructor(
    private pending: PendingAnswer<string, boolean>,
    // Session-scoped, so a note the user approved stays approved after a
    // command moves the target off it.
    private approved: ApprovalRepository,
  ) {}

  // The path asked about is the path from the vault root, so the user approves
  // a note rather than a title two notes could share (FR13).
  static of(
    ask: (path: string) => Promise<boolean>,
    cancellation = new TurnCancellation(),
    approved = new ApprovalRepository(),
  ): OpenApproval {
    return new OpenApproval(new PendingAnswer(ask, cancellation), approved)
  }

  // Auto mode, and what a test constructs when the question is not what it is
  // exercising. The mode is a choice of collaborator, not a branch (NFR3).
  static granted(): OpenApproval {
    return OpenApproval.of(() => Promise.resolve(true))
  }

  // Granted once, held for the session: a two-step instruction is approved
  // before its first step rather than again at the edit (FR12), and a command
  // that moves the target away does not cost the user a second yes. A cancelled
  // turn declines, so the loop never stays parked (FR29).
  async grantFor(path: string): Promise<boolean> {
    if (this.approved.includes(path)) return true
    const answer = await this.pending.awaiting(path, false)
    if (answer) this.approved.record(path)
    return answer
  }
}
