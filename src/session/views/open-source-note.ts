// Opens a note the panel is showing, by the path a search returned. What a
// source line does when the user clicks it, so following up an answer is a
// click rather than a search of their own.
//
// A port rather than an import, because nothing under views/ outside obsidian/
// may reach for Obsidian. Absent in the suite and wherever a panel renders
// without a vault, which is what makes a source render as plain text rather
// than as a dead link.
//
// This opens a note for reading. It is not the session's target, which only
// open_note and a command may set: a user following a citation is not asking
// to edit what they land on.
export type OpenSourceNoteFn = (path: string) => void
