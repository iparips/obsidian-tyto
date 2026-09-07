import { ChoiceRequest } from './models/choice-request'
import { ChosenNotes } from './models/chosen-notes'
import { PendingAnswer } from './pending-answer'
import { TurnCancellation } from './turn-cancellation'

// One choice, asked of whoever supplied it. The engine awaits a path without
// knowing that a panel row is what produces it. The parking itself is
// PendingAnswer's, so a choice and a question share one mechanism.
export class NoteChoice {
  constructor(
    private pending: PendingAnswer<ChoiceRequest, string | null>,
    // Turn-scoped, so a note chosen in one turn is asked about again in the
    // next: consent is about the write in front of the user.
    private chosen: ChosenNotes,
  ) {}

  // The paths offered are from the vault root, so the user chooses a note
  // rather than a title two notes could share (FR3). The purpose travels with
  // them, since the user is consenting to a write rather than to a path.
  static of(
    ask: (request: ChoiceRequest) => Promise<string | null>,
    cancellation = new TurnCancellation(),
    chosen = new ChosenNotes(),
  ): NoteChoice {
    return new NoteChoice(new PendingAnswer(ask, cancellation), chosen)
  }

  // Auto mode, and what a test constructs when the choice is not what it is
  // exercising. The mode is a choice of collaborator, not a branch (FR13).
  static automatic(chosen = new ChosenNotes()): NoteChoice {
    return NoteChoice.of(
      (request) => Promise.resolve(request.candidates[0] ?? null),
      undefined,
      chosen,
    )
  }

  // Null is the decline, which is an answer rather than a failure: the user
  // saying "none of these" is the tool working (FR6). A cancelled turn declines,
  // so the loop never stays parked (NFR2).
  async choose(request: ChoiceRequest): Promise<string | null> {
    const picked = await this.pending.awaiting(request, null)
    if (picked === null || !request.candidates.includes(picked)) return null
    this.chosen.record(picked)
    return picked
  }

  // What open_note checks. Separate from choose, because opening is a later
  // call than choosing and must not re-ask (FR11).
  holds(path: string): boolean {
    return this.chosen.includes(path)
  }
}
