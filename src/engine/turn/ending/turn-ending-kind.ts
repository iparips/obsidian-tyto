// How a turn ended, as the harness decided it. One value per way the loop can
// stop, so a transcript reads the ending rather than inferring it: TurnOutcomes
// builds exhausted and stuck as the same chat failure, and the panel shows one
// message for both.
export enum TurnEndingKind {
  // The step budget ran out. The steps list is where the turn went.
  Exhausted = 'exhausted',
  // The same refusal twice, so a third way of being refused is next.
  Stuck = 'stuck',
  // The model answered in text, which is the turn's reply.
  Replied = 'replied',
  // The provider failed, and the message reaches the user as an error.
  Failed = 'failed',
  // The user stopped the turn, whether between steps or mid-request.
  Cancelled = 'cancelled',
  // The model answered from search, which is the turn's reply and needs no
  // step of its own to restate.
  Answered = 'answered',
}
