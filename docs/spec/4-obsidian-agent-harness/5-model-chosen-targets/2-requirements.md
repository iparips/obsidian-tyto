# Requirements: Model-Chosen Targets

Let the model open a note it found itself, rather than only one a command
opened. A command still wins where one matches, and two modes decide whether
the model asks before a search-derived open.

## Table of Contents

1. [Problem](#problem)
2. [Goals](#goals)
3. [Non-goals](#non-goals)
4. [User stories](#user-stories)
5. [Two modes](#two-modes)
6. [Command first, search second](#command-first-search-second)
7. [Approving a multi-step instruction](#approving-a-multi-step-instruction)
8. [Requirements](#requirements)
9. [Non-functional requirements](#non-functional-requirements)
10. [What the design must settle](#what-the-design-must-settle)

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
- Reach a note by command where one exists, and by search only where none does.
- Name the note's folder as well as its title, so two notes sharing a name are
  told apart.

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
- As a user with two notes called todo, I read the folder under the header name
  and know which one the session is on.
- As a user who configured a command for my daily note, that command opens it,
  rather than a search finding it a second way.
- As a user, I say "open my todo and add visit doctor at the top", and I approve
  the note once, before either step runs.

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

## Command first, search second

Two routes now reach a note, and they are not equal. A command is the route the
user configured, so it is the one to try first.

| Route            | Path comes from            | Confirmation | Rank   |
| ---------------- | -------------------------- | ------------ | ------ |
| Allowed command  | The user's own setting     | Never asks   | First  |
| Search then open | A search hit this turn     | Confirm mode | Second |

Ranking them is not only about the interruption. A command follows the user's
own configuration, so it stays right when the vault is reorganised, and a
search-derived path is only as good as the hit behind it.

The ordering therefore holds in auto mode too, where no confirmation is at
stake. Auto mode removes the question, not the preference.

Matching is the model's judgement, made against the command catalogue it is
already given. A command matches when its own name says it opens the note the
user asked for.

## Approving a multi-step instruction

"Open my todo and add visit doctor at the top" is one instruction with two
steps. The note is chosen once, and everything after it depends on that choice.

So the confirmation comes before the first step, not before the edit. The model
names the best candidate it found, and waits.

Approving it approves the rest of the instruction against that note. A user who
has agreed to the note has agreed to what the turn said it would do there.

This is what FR5 already asks for, read against a turn that does more than one
thing. It is called out because the tempting alternative, asking again at the
edit, turns one instruction into two interruptions.

## Requirements

FR1. Give the model a tool that opens an existing note by path, retargeting the
session to it.

FR2. Refuse a path that does not have a note, telling the model so rather than
failing the turn.

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

FR11. Instruct the model to prefer an allowed command that reaches the note, and
to search and open only where no command matches.

FR12. Ask before the first model-chosen open of a turn, so a multi-step
instruction is approved once rather than at each step.

FR13. Name the candidate note in that question, with its path from the vault
root, so the user approves a note rather than a title.

FR14. Show the target note's path from the vault root beneath its name in the
panel header.

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

NFR6. The header path is subordinate to the name: smaller and muted, per the
context weight in
[3-tidy-up-chat-panel](../3-tidy-up-chat-panel/2-requirements.md). A long path
truncates rather than wrapping the header onto a second line.

## What the design must settle

- A turn is one promise resolving to a summary. Pausing mid-turn for a click has
  no mechanism yet, and the loop, the panel state and the phase list all change.
- Whether a declined open ends the turn or lets the model try again. Ending is
  simpler; retrying is kinder when the model's second guess is right.
- Whether "don't ask again" is worth having, and if so what it is scoped to.
  Claude Code scopes file edits to the session and shell commands to the repo;
  the analogue here is unclear, and per-note is probably too fine.
- Whether the model should be told the mode. A model that knows it is in auto
  mode may act more freely than the user meant.
- Which end of a long path truncates in the header. The leading folder says
  where in the vault the note lives; the trailing one says which sibling it is.
- Whether an approved note holds for the rest of the turn, or only for the step
  that asked. FR12 says the turn, and the design must say what ends that hold.
