import { ChoiceRequest } from './choice-request'
import { NotesChosenByUserRepository } from '../turn/notes-chosen-by-user-repository'
import { PendingAnswer } from './pending-answer'
import { TurnCancellationController } from '../turn/turn-cancellation-controller'

// One choice, asked of whoever supplied it. The engine awaits a path without
// knowing that a panel row is what produces it. The parking itself is
// PendingAnswer's, so a choice and a question share one mechanism.
export class NoteChoiceService {
  constructor(
    private pending: PendingAnswer<ChoiceRequest, string | null>,
    // Turn-scoped, so a note chosen in one turn is asked about again in the
    // next: consent is about the write in front of the user.
    private notesChosenByUser: NotesChosenByUserRepository,
  ) {}

  // The paths offered are from the vault root, so the user chooses a note
  // rather than a title two notes could share (FR3). The purpose travels with
  // them, since the user is consenting to a write rather than to a path.
  static of(
    askFn: (request: ChoiceRequest) => Promise<string | null>,
    cancellationController = new TurnCancellationController(),
    notesChosenByUser = new NotesChosenByUserRepository(),
  ): NoteChoiceService {
    return new NoteChoiceService(
      new PendingAnswer(askFn, cancellationController),
      notesChosenByUser,
    )
  }

  // Auto mode: one candidate is a translation of what the search found, several
  // are a choice the user makes. A collaborator, not a branch (FR13).
  static singleMatch(
    askFn: (request: ChoiceRequest) => Promise<string | null>,
    cancellationController = new TurnCancellationController(),
    notesChosenByUser = new NotesChosenByUserRepository(),
  ): NoteChoiceService {
    return NoteChoiceService.of(
      (request) => NoteChoiceService.resolveOrAsk(request, askFn),
      cancellationController,
      notesChosenByUser,
    )
  }

  private static resolveOrAsk(
    request: ChoiceRequest,
    askFn: (request: ChoiceRequest) => Promise<string | null>,
  ): Promise<string | null> {
    if (request.candidates.length === 1) return Promise.resolve(request.candidates[0])
    return askFn(request)
  }

  // The default where no panel exists to askFn, so several decline rather than
  // parking forever.
  static unasked(notesChosenByUser = new NotesChosenByUserRepository()): NoteChoiceService {
    return NoteChoiceService.singleMatch(() => Promise.resolve(null), undefined, notesChosenByUser)
  }

  // Null is the decline, which is an answer rather than a failure: the user
  // saying "none of these" is the tool working (FR6). A cancelled turn declines,
  // so the loop never stays parked (NFR2).
  async choose(request: ChoiceRequest): Promise<string | null> {
    const picked = await this.pending.awaiting(request, null)
    if (picked === null || !request.candidates.includes(picked)) return null
    this.notesChosenByUser.record(picked)
    return picked
  }

  // What open_note checks. Separate from choose, because opening is a later
  // call than choosing and must not re-askFn (FR11).
  holds(path: string): boolean {
    return this.notesChosenByUser.includes(path)
  }
}
