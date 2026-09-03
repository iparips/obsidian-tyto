# Requirements: Cancelling a Turn

Let the user stop a turn that is running, and say what it left behind.

## Table of Contents

1. [Problem](#problem)
2. [Goals](#goals)
3. [Non-goals](#non-goals)
4. [User stories](#user-stories)
5. [One button for both](#one-button-for-both)
6. [Where a turn can be stopped](#where-a-turn-can-be-stopped)
7. [What a stopped turn leaves](#what-a-stopped-turn-leaves)
8. [Requirements](#requirements)
9. [Non-functional requirements](#non-functional-requirements)
10. [What the design must settle](#what-the-design-must-settle)

## Problem

A turn runs until it finishes. The panel disables its input while one is in
flight, so a user who sees the model heading the wrong way waits for it to
arrive there.

Cancel exists only for the mic. Recorder (Capture) can drop an utterance before
transcription, and the panel offers a Cancel button while recording. Nothing
stops the turn that follows.

The cost grows with what a turn can do. A single-note edit was quick and bounded.
A turn that searches, runs commands and retargets can spend ten iterations, and
each one may write.

Two turns need this most. One that misread the instruction and is editing the
wrong thing, and one that is simply taking too long on a phone the user wants
back.

## Goals

- Stop a running turn from the panel.
- Stop it promptly, rather than at the end of the current iteration.
- Leave the vault in a state the user can understand.
- Say what the turn had done when it stopped.
- Let the next utterance run normally, with the session still usable.

## Non-goals

- Undoing edits the turn already applied. That is release 7's undo story, and a
  cancel that half-reverts is worse than one that does not try.
- Pausing and resuming. A cancelled turn is finished, not suspended.
- Cancelling an individual tool call while the turn continues.
- Stopping a command Obsidian is already running. The plugin hands control over
  and does not get it back.
- Cancelling from outside the panel, such as a hotkey or the command palette.

## User stories

- As a user watching the model edit the wrong section, I stop it before it
  finishes.
- As a user on a phone, I stop a turn that is taking too long and get the input
  back.
- As a user who cancelled, I read what the turn had already changed, rather than
  guessing.
- As a user who cancelled, my next utterance runs against a session that still
  works.
- As a user, cancelling a turn that had changed nothing leaves my note exactly as
  it was.
- As a user, one button stops whatever is happening, rather than my working out
  which stage the panel is in.

## One button for both

Cancel already exists for the mic, and it means the same thing a turn cancel
means: stop, and keep nothing. So it is one control rather than two.

Cancel takes the Send button's place while something runs. Send is disabled in
every one of those states anyway, so the row holds one button that does
something rather than two where one is dead.

| Panel state  | Send position | Cancel does                       |
| ------------ | ------------- | --------------------------------- |
| Idle         | Send          | Not shown                         |
| Recording    | Cancel        | Discards the audio                |
| Transcribing | Cancel        | Discards the audio                |
| Thinking     | Cancel        | Stops the turn                    |
| Waiting      | Cancel        | Stops the turn, answering nothing |

Cancel is not Stop. While recording, Stop transcribes and runs the turn, and
Cancel throws the audio away. Widening Cancel keeps that meaning: it is the
button that ends the current work without taking it further.

So the user does not have to know which stage the panel is in. The rightmost
button is Send when there is something to send, and Cancel when there is
something to stop.

## Where a turn can be stopped

A turn is a loop of model calls and tool calls. The two differ in how they stop
and in what they leave.

| Waiting on           | Stops by                    | Leaves behind        |
| -------------------- | --------------------------- | -------------------- |
| The model's reply    | Abandoning the request      | Nothing              |
| A tool call, reading | Abandoning after it settles | Nothing              |
| A tool call, writing | Abandoning after it settles | The edits it applied |
| A user's answer      | Settling the question       | Nothing              |

A model call is the longest wait and the safest to abandon, since nothing has
been applied. It is also where a turn spends most of its time.

A write is the case that matters. An edit either lands or it does not, so cancel
takes effect between tool calls rather than inside one. A half-applied edit is
not a state the note can hold.

## What a stopped turn leaves

The vault keeps what the turn already wrote. Reverting is release 7's work, and
a partial revert would be a second uncertain state on top of the first.

So the obligation is to report rather than repair. A user who cancelled must be
able to see which notes changed, in the panel, without reconstructing it from
the note itself.

The session stays usable. Its chat history keeps the turn that was cancelled,
including the fact that it was, so the model's next turn knows the work stopped
partway rather than believing it finished.

## Requirements

### Stopping

FR1. Offer one cancel control that stops whatever is running, whether that is
the mic or a turn.

FR2. Put it where the Send button sits, replacing it whenever the panel is
recording, transcribing, thinking or waiting, and only then.

FR3. Keep the mic's Stop separate, since it transcribes and runs the turn where
cancel discards.

FR4. Abandon the model request in flight, rather than waiting for it to return.

FR5. Stop between tool calls, never inside one, so no edit is half-applied.

FR6. Settle a question or confirmation the turn is parked on, so a cancel
reaches a waiting turn as well as a working one.

FR7. Run no further tool call once the user has cancelled.

### After it stops

FR8. Return the panel to idle, so the next utterance can be sent.

FR9. Say in the panel that the turn was cancelled, distinctly from one that
finished or failed.

FR10. Name what the turn had changed when it stopped, or say it changed nothing.

FR11. Record the cancellation in the chat history, so the next turn knows the
work stopped partway.

FR12. Leave the session bound to the note it was on when cancelled.

FR13. Say nothing in the panel when a cancel discarded only a recording, as it
does today.

### Not cancelling

FR14. Ignore a cancel that arrives after the turn has already finished.

## Non-functional requirements

NFR1. A turn nobody cancels behaves exactly as it does today, including the
prompt it sends byte for byte.

NFR2. Cancelling leaves no work running after the panel says idle. An abandoned
request must not apply an edit when it returns.

NFR3. Cancelling is always available while a turn runs, including while it waits
on the model, on a tool, or on an answer.

NFR4. A cancelled turn releases the utterance queue, so a later utterance is not
blocked behind it.

NFR5. The vault is never left mid-edit. Cancel is between operations.

## What the design must settle

- What carries the cancellation to the parts of a turn that must see it. The
  loop, the provider request and a parked question are three places, and passing
  a flag to each is not obviously right.
- Whether AbortSignal reaches the provider. MistralProvider (Providers) calls
  fetch, which accepts one, but the ChatProvider (Providers) contract does not
  carry it today.
- How FR8 knows what changed. TurnRepository (Engine) holds the last edit
  position rather than a list of edits, so naming what was written may need a
  record that does not exist.
- Whether a cancelled turn's partial work belongs in the chat history as tool
  results, or only as the fact that it was cancelled. Full results are honest but
  invite the model to continue where it stopped.
- What happens to the mic button while a turn runs. It is disabled today, and a
  row of one live button may read better than one live and one dead.
- Whether cancelling during a command that Obsidian is running is refused, or
  accepted and applied once control returns.
