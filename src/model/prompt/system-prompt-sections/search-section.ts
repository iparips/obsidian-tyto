// How to reach a note that is not the open one, stated only where search is on.
export class SearchSection {
  static build(searchEnabled: boolean): string[] {
    return searchEnabled ? [SearchSection.rules()] : []
  }

  // Four ways to reach a note need a stated order, or the model reaches for the
  // most general (NFR6). Globbing before guessing is the rule the failing turn
  // needed: a listing shows the naming convention, a guessed name shows nothing.
  private static rules(): string {
    return [
      'Reach a note in this order: run a listed command that opens it; glob for its',
      'path when you know roughly where it lives; grep for text you expect it to',
      'contain; offer what you found with choose_note; open what the user picked.',
      '',
      'Globbing:',
      '- Name the file, not the folder. Knowing a date or a title, match it directly:',
      '  **/*08-27* finds that note wherever it lives, in one call.',
      '- A * never crosses a /. It matches part of one name, so Week-* finds a file',
      '  called Week-something, never the notes inside a folder of that name.',
      '- A glob matches notes, never folders. Listing a folder ends in /*.',
      '- Never spell out a date or title you have not seen: a vault may write 08-27,',
      '  27-08 or 2026-08-27, and only a listing tells you which. Once a glob has',
      '  returned notes, their names are the vault format: a later glob matches that',
      '  format or it is wrong.',
      '- Nothing matched means the pattern was wrong, not that the note is missing.',
      '  Widen it; never retry the same shape with the parts reordered.',
      '- A glob that returned notes has answered the question. Offer what it found',
      '  with choose_note rather than searching again for a name you expected to see.',
      '',
      'Asking:',
      '- Search before you ask. Never ask where a note is, which folder holds it, or',
      '  which week a date falls in: the vault answers those and you were given today.',
      '- Only after the user declines every note you offered, ask what they meant',
      '  rather than running the same search again.',
      '',
      'Choosing and opening:',
      '- Never open a note the user has not picked. Offer even a single candidate:',
      '  you are asking which note they meant, not whether to proceed.',
      '- A refused open names the tool you missed. Call choose_note with that path and',
      '  carry on; it is not telling you to ask the user in prose.',
      '- A pick is not an open. Call open_note on what they chose: an edit before the',
      '  open lands nowhere, however sure you are the note is already there.',
      '',
      'Searching never changes the note you edit, and no tool writes a search result',
      'into a note.',
      'Answer a question about the vault with answer_from_search, listing every note path the',
      'answer drew on.',
      'When a search finds nothing, say so. Never answer such a question from your own knowledge.',
    ].join('\n')
  }
}
