# Requirements: Model-Chosen Targets

Let the model open a note it found itself, rather than only one a command
opened. Two modes decide whether it asks first.

## Problem

The harness MVP routes every destination through a command, because a command
resolves a path from the user's own configuration and a model-chosen path is a
guess ([04-decisions.md](../1-harness-mvp/04-decisions.md)).

That holds for creating a note. It does not hold for opening one that exists.

Asked to add an item to this week's todo list, the model reasons its way to
`1 - Journal/Weekly/Week-36/todo.md` and is right. It cannot act on that, so it
asks the user to open the file and try again. The user knows less about where
the file is than the model just demonstrated it does.

The rule was written before search shipped. Search changes what a path is: the
model can confirm a note exists before opening it, so the destination is a
lookup with a verifiable answer rather than a guess.

## Goals

- Open an existing note the model located, and edit it.
- Verify the note exists before the session moves to it.
- Let a user who trusts the model skip the confirmation.
- Let a user who does not see every model-chosen move before it happens.
- Keep a command-opened destination unconfirmed, since the user configured it.

## Non-goals

- Creating a note at a model-chosen path. A wrong guess lands a stray note with
  no error, which is what release 7 must solve alongside its undo story.
- Writing to more than one note per turn. Still release 7.
- Per-folder or per-path rules. One mode covers the vault.
- Remembering a confirmation across sessions.

## User stories

- As a user, I say "add toilet paper to this week's todo list", and the model
  finds the file, opens it and adds the item.
- As a cautious user, I am shown the note the model chose and approve it before
  anything is written.
- As a cautious user, I decline, and the turn stops without an edit.
- As a trusting user, I turn confirmation off and the same instruction runs
  without interruption.
- As a user in either mode, a command-opened note never asks, because I
  configured what that command opens.
- As a user, I see in the panel which notes a turn moved to, and whether each
  came from a command or from the model.

## Two modes

Modes set what happens by default. They do not override the rules below them:
an unverified path is refused in both modes, and creating a note is out of
scope in both.

| Mode    | A command opens a note | The model opens a note    |
| ------- | ---------------------- | ------------------------- |
| Confirm | Proceeds               | Asks, and waits           |
| Auto    | Proceeds               | Proceeds, and says it did |

Confirm is the default. A user who has not thought about this should get the
mode that cannot surprise them.

## Requirements

FR1. Give the model a tool that opens an existing note by path, retargeting the
session to it.

FR2. Refuse a path that names no note, telling the model so rather than failing
the turn.

FR3. Refuse a path the model has not seen in a search result this turn, so an
opened note is one the vault confirmed rather than one the model recalled.

FR4. Cap the number of model-chosen opens one turn may perform.

FR5. Ask the user before the session moves to a model-chosen note, in confirm
mode, naming the note.

FR6. Wait for that answer before any edit lands, and stop the turn without an
edit when the user declines.

FR7. Tell the model it was declined, so it reports what stopped rather than
claiming an edit.

FR8. Never ask when a command opened the note, in either mode.

FR9. Let the user switch modes in settings, defaulting to confirm.

FR10. Show in the panel which note a turn moved to, and whether a command or the
model chose it.

FR11. Instruct the model, in confirm mode, that opening a note interrupts the
user, so it should prefer a command that reaches the same note.

## Non-functional requirements

NFR1. A declined confirmation leaves the vault untouched. No partial edit, and
the session stays on the note it was on.

NFR2. A turn waiting on a confirmation holds no editor handle it assumes is
still valid: the target is re-resolved after the answer, per the harness MVP.

NFR3. Auto mode changes what is asked, never what is possible. Every refusal in
FR2, FR3 and FR4 applies in both modes.

NFR4. A vault with search disabled has no model-chosen opens at all, since FR3
makes a search result the only source of an openable path.

NFR5. The confirmation is a panel interaction, not a modal, so a session on a
phone is not blocked by a dialog the drawer cannot show.

## What the design must settle

- A turn is one promise resolving to a summary. Pausing mid-turn for a click has
  no mechanism yet, and the loop, the panel state and the phase list all change.
- Whether a declined open ends the turn or lets the model try again. Ending is
  simpler; retrying is kinder when the model's second guess is right.
- Whether "don't ask again" is worth having, and if so what it is scoped to.
  Claude Code scopes file edits to the session and shell commands to the repo;
  the analogue here is unclear, and per-note is probably too fine.
- Whether the model should be told the mode. FR11 says yes for confirm mode, but
  a model that knows it is in auto mode may act more freely than the user meant.
