# Requirements

An edit goes to the note the turn is targeting, and the user can see which note
that was.

## One note, structurally

NoteEditTool reads targetNote from the turn and edits it. The tool call carries
content and an anchor, never a path, so the model has no way to name a note to
write to.

The target moves two ways, both consented: a command opens a note, or the model
opens one the user chose. Nothing else moves it.

## The window

choose_note does not move the target. open_note does. Between them the turn
still points at the note it was on, so an edit in that window lands there while
the model is reasoning about the note it chose.

That is the reported failure: the model globbed, was refused an unchosen open,
called choose_note, then edited without ever opening.

The edit landing on the current note is correct. Consent names a note the model
may open, and until the open runs the turn is still on the note the user has in
front of them. What was wrong is that nothing said so.

## Why it was not visible

The edit step reads "Edit: applied". It names no note, so a user watching the
panel sees a choice of one note followed by an edit, and has nothing telling
them the edit went elsewhere.

## What the guard costs today

Two fields withdraw permission from the target once a glob or grep runs.

- It refuses a case the user asked for. Search the vault, decide the note in
  front of you is right, and the edit is refused until the model opens a note
  that is already open.
- It costs two model calls to recover, since the note must be offered with
  choose_note and then opened.
- It fires on every searching turn, while the window it protects opens only
  where a choice was made.

## What is required

- An edit step names the note the edit went to
- The note the turn is targeting is editable, with no further check
- A note the user opens mid-turn becomes the running turn's target
- A turn that searches may still edit the note it started on

The last is the change in behaviour. Today it is refused.

## What does not change

The consent mechanism from [14-choosing-the-note](../14-choosing-the-note/1-index.md).
A note the model opens must still be one the user chose this turn, which is
what makes an opened note a legitimate target.
