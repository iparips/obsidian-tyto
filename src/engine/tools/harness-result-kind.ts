// What a tool asks of the dispatcher once it has run. One value per way a
// result can be handled, so a new tool cannot forget to say which it needs:
// the switch that reads this refuses to compile until every kind is covered.
export enum HarnessResultKind {
  // Nothing further. A glob, a grep, a read: the text is the whole result.
  Text = 'text',
  // Park the turn until a person picks one of the offered notes.
  Choice = 'choice',
  // Open this path and move the session onto it.
  OpenNote = 'openNote',
  // A command ran, and may have moved the note under the session.
  ObsidianCommandRan = 'obsidianCommandRan',
}
