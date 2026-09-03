# Requirements: Model-Chosen Targets

Let the model open a note it found itself, rather than only one a command
opened. A command still wins where one matches, and two modes decide whether
the model asks before a search-derived open.

Where no route resolves the note, the model asks the user instead of guessing,
and a waiting turn opens the panel so the question is seen.

## Table of Contents

1. [Problem](#problem)
2. [Goals](#goals)
3. [Non-goals](#non-goals)
4. [User stories](#user-stories)
5. [Two modes](#two-modes)
6. [Command first, search second](#command-first-search-second)
7. [Approving a multi-step instruction](#approving-a-multi-step-instruction)
8. [Asking when no route resolves the note](#asking-when-no-route-resolves-the-note)
9. [Reaching a user who is not looking](#reaching-a-user-who-is-not-looking)
10. [Requirements](#requirements)
11. [Non-functional requirements](#non-functional-requirements)
12. [What the design must settle](#what-the-design-must-settle)

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

Search does not resolve every instruction. Two shopping lists match equally
well, or none does, and then the model has one move: end the turn with a
question in its summary, as the prompt tells it to.

The panel cannot tell that reply from a finished edit. Both arrive as a summary,
render as an assistant entry, and return the phase to idle. So nothing
downstream can show that a turn is waiting, because the fact is gone before the
panel sees it.

On a phone the cost is highest, and it lands on the confirmation above as well
as on the question. The panel is a drawer over the note, so a user who put the
phone down sees an open note and no sign that anything wants them.

## Goals

- Open an existing note the model located, and edit it.
- Verify the note exists before the session moves to it.
- Let a user who trusts the model skip the confirmation.
- Let a user who does not see every model-chosen move before it happens.
- Keep a command-opened destination unconfirmed, since the user configured it.
- Reach a note by command where one exists, and by search only where none does.
- Name the note's folder as well as its title, so two notes sharing a name are
  told apart.
- Ask the user where no route resolves the note, rather than guessing or giving
  up on the turn.
- Tell a user whose panel is closed that a turn wants them, without taking the
  screen.
- Tell them a turn finished or failed, more quietly than one that is waiting.

## Non-goals

- Creating a note at a model-chosen path. A wrong guess lands a stray note with
  no error, which is what release 7 must solve alongside its undo story.
- Writing to more than one note per turn. Still release 7.
- Per-folder or per-path rules. One mode covers the vault.
- Remembering a confirmation across sessions.
- Free-form conversation. One question, one answer, then the turn continues.
- Notifying outside Obsidian. No system notification, no badge on the app icon.
- Changing what the model is told about ambiguity. The instruction to ask rather
  than guess is already right, and only the mechanism changes.

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
- As a user with two shopping lists, the model asks which I meant and I pick one
  without restating the instruction.
- As a user on a phone, my note stays on screen and a notice tells me the model
  needs me, which I open the panel from when I am ready.
- As a user on a phone, I learn my edit landed without opening the panel to
  check.
- As a user, I answer in my own words when none of the offered options fit.
- As a user who walked away, I come back to a panel still showing what it wanted,
  rather than a turn that gave up.
- As a user, a turn that needs nothing from me never opens the panel.

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

| Route            | Path comes from        | Confirmation | Rank   |
| ---------------- | ---------------------- | ------------ | ------ |
| Allowed command  | The user's own setting | Never asks   | First  |
| Search then open | A search hit this turn | Confirm mode | Second |

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

## Asking when no route resolves the note

The model should ask less often than it does today, not more. Most of its
current questions are ones the routes above remove.

| Situation                           | Right move         |
| ----------------------------------- | ------------------ |
| A command opens the note            | Run it             |
| Search finds one strong candidate   | Open it, confirm   |
| Search finds several, all plausible | Ask which          |
| Search finds nothing                | Ask where          |
| The instruction itself is unclear   | Ask what was meant |

Asking is what is left once the model has exhausted the routes it can resolve
alone. The prompt must say so, or a model given a way to ask will reach for it
instead of searching.

## Reaching a user who is not looking

A waiting turn must be noticeable without taking the screen. Opening the drawer
covers the note the user is reading and moves them somewhere they did not ask to
go, to answer a question they have not yet read.

So the panel is never opened for them. A notice says the turn is waiting, and
the user opens the panel when they choose.

| Turn state           | Panel closed          | Panel open      |
| -------------------- | --------------------- | --------------- |
| Working              | Nothing               | Shows progress  |
| Waiting on an answer | Notice, stays         | Already visible |
| Finished             | Notice, fades         | Shows the reply |
| Failed               | Failure notice, fades | Shows the error |

Three kinds, because they ask for different things. A waiting turn needs an
action, so its notice stays until the question is answered: one the user missed
is the invisible turn again. A finished turn is only reporting, so its notice
fades. A failure fades too, but reads as a failure, since it is the outcome a
user most wants to catch.

A finished notice is a milestone marker, not a report. One line saying what the
turn did, so the user knows it landed without opening the panel. The panel holds
the detail, and anything longer than a line belongs there rather than over the
note.

Each notice says what tapping it does, rather than relying on styling to suggest
it. A call to action names the thing waiting, so "tap to answer" and "tap to
view" tell the user which kind of notice they are looking at before they read
the rest of it.

Nothing is shown while a turn is working. The panel already shows progress to
anyone watching, and a notice per turn would train the user to ignore them.

## Requirements

### Opening a note the model found

FR1. Give the model a tool that opens an existing note by path, retargeting the
session to it.

FR2. Refuse a path that does not have a note, telling the model so rather than
failing the turn.

FR3. Refuse a path the model has not seen in a search result this turn, so an
opened note is one the vault confirmed rather than one the model recalled.

FR4. Cap the number of model-chosen opens one turn may perform.

### Confirming that open

FR5. Ask the user before the session moves to a model-chosen note, in confirm
mode, naming the note.

FR6. Wait for that answer before any edit lands, and stop the turn without an
edit when the user declines.

FR7. Tell the model it was declined, so it reports what stopped rather than
claiming an edit.

FR8. Never ask when a command opened the note, in either mode.

FR12. Ask before the first model-chosen open of a turn, so a multi-step
instruction is approved once rather than at each step.

FR13. Name the candidate note in that question, with its path from the vault
root, so the user approves a note rather than a title.

### Choosing between the two routes

FR9. Let the user switch modes in settings, defaulting to confirm.

FR11. Instruct the model to prefer an allowed command that reaches the note, and
to search and open only where no command matches.

### What the panel shows

FR10. Show in the panel which note a turn moved to, and whether a command or the
model chose it.

FR14. Show the target note's path from the vault root beneath its name in the
panel header.

### Asking the user a question

FR15. Give the model a tool that asks the user a question and returns their
answer as the tool result.

FR16. Park the turn on that tool call until the answer arrives, so the model
acts on the answer within the same turn.

FR17. Show the question in the panel as what the turn is waiting on, distinctly
from a reply that finished a turn.

FR18. Let the user answer in their own words.

FR19. Offer the model a way to suggest answers, and let the user pick one
without typing.

### Notices

FR20. Show a notice when a turn starts waiting and the panel is not visible,
for a question and for the confirmation in FR5 alike.

FR21. Keep that notice up until the question is answered or the turn ends,
rather than fading on a timer.

FR22. Show a fading notice when a turn finishes and the panel is not visible,
carrying one line saying what the turn did.

FR23. Show a distinct notice when a turn fails, which reads as a failure rather
than as a turn that finished.

FR24. Open the session panel when the user acts on any notice, so reaching the
panel is one step.

FR25. State the action on every notice, so the user reads that it can be tapped
rather than inferring it from styling.

FR26. Word that action for what waits behind it, so a question and a finished
turn are told apart before the notice is read in full.

FR27. Never open the panel on the user's behalf.

FR28. Show no notice while a turn is working.

### Bounding a parked turn

FR29. Settle a pending question when the user cancels the turn, so the loop
never parks forever. Cancelling itself is
[5-cancelling-a-turn](../5-cancelling-a-turn/1-index.md).

FR30. Cap the number of questions one turn may ask.

FR31. Instruct the model to ask only where no command and no search resolve the
destination.

FR32. Keep an unanswered question on screen after the turn ends, so a user who
dismissed the notice can still find what was asked.

## Non-functional requirements

NFR1. A declined confirmation leaves the vault untouched. No partial edit, and
the session stays on the note it was on.

NFR2. A turn waiting on a confirmation or a question holds no editor handle it
assumes is still valid: the target is re-resolved after the answer, per the
harness MVP.

NFR3. Auto mode changes what is asked, never what is possible. Every refusal in
FR2, FR3 and FR4 applies in both modes.

NFR4. A vault with search disabled has no model-chosen opens at all, since FR3
makes a search result the only source of an openable path.

NFR5. The confirmation is a panel interaction, not a modal, so a session on a
phone is not blocked by a dialog the drawer cannot show.

NFR6. One mechanism serves the confirmation and the question. Two ways to park
a turn would drift.

NFR7. A turn that asks nothing behaves exactly as it does today, including the
prompt it sends byte for byte when neither tool is offered.

NFR8. A notice never steals keyboard focus, so a user typing when a question
arrives keeps typing into the note.

NFR9. No notice repeats what the panel is already showing. A visible panel is
the notification.

NFR10. The header path is subordinate to the name: smaller and muted, per the
context weight in
[3-tidy-up-chat-panel](../3-tidy-up-chat-panel/2-requirements.md). A long path
truncates rather than wrapping the header onto a second line.

## What the design must settle

- A turn is one promise resolving to a summary. Pausing mid-turn for a click has
  no mechanism yet, and the loop, the panel state and the phase list all change.
- Whether the confirmation and the question are one collaborator or two. NFR6
  wants one mechanism, but a confirmation is a yes-or-no and a question is free
  text with optional suggestions.
- Whether the whole notice is the target or only the call to action inside it.
  The whole notice is easier to hit on a phone; a link is clearer about what is
  clickable.
- What FR32 shows once the turn has ended. The question is no longer answerable,
  so the entry is a record rather than a prompt.
- How a one-line notice is produced from a turn that answered at length. The
  model writes the summary, and nothing today asks it for a short form.
- Whether the suggestions in FR19 are buttons, a numbered list the user types
  against, or both. The drawer is narrow and three long options may not fit.
- Whether a parked turn should time out. The utterance queue is single-flight,
  so a turn waiting forever blocks every later utterance.
- Whether an unanswered question survives a plugin reload, or dies with the
  session. FR32 covers only the turn ending.
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
