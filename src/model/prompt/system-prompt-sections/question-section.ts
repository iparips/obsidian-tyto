// When to ask the user rather than guess.
export class QuestionSection {
  // Omitted where no route exists to exhaust, so a vault with neither flow
  // produces the release 3 prompt byte for byte (NFR7).
  static build(canRunCommands: boolean, searchEnabled: boolean): string[] {
    if (!canRunCommands && !searchEnabled) return []
    return [QuestionSection.rules()]
  }

  // Stated where the routes are, so the model reads what to exhaust before it
  // reaches for the question rather than treating asking as a first move (FR31).
  // Which note the user meant is choose_note's question, not this one: a
  // shortlist offered here would be prose, and nothing would record the consent.
  private static rules(): string {
    return [
      'You can ask the user one question and act on their answer in the same turn.',
      'Ask only when no listed command and no search resolves what the instruction named:',
      'when a search finds nothing, or when the instruction itself is unclear.',
      'Never ask which of several notes the user meant. That is choose_note: search,',
      'then offer what you found. Ask only once they have declined every one.',
      'Never ask permission to do what the user already asked for. They said what they',
      'wanted; carry it out. Offering the note with choose_note is how you check which',
      'note they meant, and it is not a question you write in prose.',
      'Offer suggestions when the answer is not a note, so the user picks rather than types.',
    ].join('\n')
  }
}
