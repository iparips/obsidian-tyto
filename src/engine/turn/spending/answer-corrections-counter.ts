// One correction per turn. A model told to answer through the tool complies on
// the next step; one that does not is not going to be talked round by a second
// telling, and its reply is worth more to the user than the budget spent
// refusing it again.
const MAX_CORRECTIONS = 1

// How many times this turn has been sent back to answer through the tool. A
// counter rather than a boolean, because the cap is the fact worth naming and a
// boolean would put the number in the reader's head instead.
export class AnswerCorrectionsCounter {
  private corrections = 0

  canCorrect(): boolean {
    return this.corrections < MAX_CORRECTIONS
  }

  spend(): void {
    this.corrections += 1
  }
}
