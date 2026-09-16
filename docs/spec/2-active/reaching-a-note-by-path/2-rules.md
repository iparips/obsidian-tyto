---
created: 2026-09-16
updated: 2026-09-16
---

# The Rules

What must be true of a target note and of where its contents come from. Every
decision in this spec cites one of these, and every defect in
[3-requirements.md](3-requirements.md) is one of them failing.

### Only the model moves a running turn's target

Once a turn is running, the user cannot change its target. Only the model can,
by calling a tool that opens a note.

| Who       | Between turns              | While a turn runs                 |
| --------- | -------------------------- | --------------------------------- |
| The user  | Sets it, by opening a note | Cannot change it                  |
| The model | Has no turn to act in      | Sets it, by a tool that opens one |

The user opening a note mid-turn is not ignored: it sets the target for the next
turn, per D1 of
[following-the-user-mid-turn](../following-the-user-mid-turn/1-index.md). What
it must not do is move the note the running turn writes to.

That is what makes a turn's target knowable: one note, fixed when the turn
starts unless the model moves it, so a user clicking elsewhere cannot make an
utterance land where they did not ask.

The four places that write a target are these cases and no others:
SessionPanelPropsBuilder reads the open note at session start, EditEngine
follows a tab change, and ToolDispatcher moves it when a tool opens a note.

### The editor is authoritative for the note you are editing

The vault is authoritative for finding notes.

A turn's note has an editor, that editor is what the write goes through, and its
contents are what an anchor matches, so reads of it come from there. Every other
note is something the vault is being asked about, and an answer that changed
with whichever tabs were open would not be reproducible.

Each defect below is one of these rules failing. A handle that follows the tab
lets the user move a running turn's target without meaning to, and a panel
naming the session's note cannot say what the turn is actually writing to.
