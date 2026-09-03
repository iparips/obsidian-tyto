# Requirements: Sessions Without a Note

Let a session start with no note open, and bind it when one is opened.

## Problem

Starting a session with no active note shows "Open a note first." and does
nothing. The command is named "Start session for active note", and every part of
the session takes a TFile at construction.

That was correct when the plugin only edited one bound note. The harness added a
search flow that answers questions without writing anything, so the refusal now
blocks work the plugin can already do.

The cost lands on the surface where opening a note first is most awkward. On
mobile the note fills the screen, so a user who wants to ask a question has to
open some note, any note, before the panel will start.

## Goals

- Start a session with no note open.
- Answer questions and search the vault from an unbound session.
- Bind to the first note the user opens, without a second command.
- Say clearly why an edit cannot run yet, rather than failing obscurely.

## Non-goals

- Letting the model choose a note to bind to. That is
  [6-model-chosen-targets](../6-model-chosen-targets/1-index.md).
- Creating a note to bind to. An unbound session waits; it does not write.
- Changing what a bound session does. Once bound, nothing differs.
- Persisting a session across a reload.

## User stories

- As a user with no note open, I start a session and ask a question about my
  vault, and get an answer.
- As a user in an unbound session, I open a note and find the session now edits
  it, without restarting anything.
- As a user who asks for an edit before opening a note, I am told no note is
  open, rather than seeing a failure I cannot act on.
- As a user on a phone, I start a session from anywhere, rather than opening a
  note I did not want in order to ask a question.

## What an unbound session can do

The two flows the harness added differ in what they need. Search reads the
vault; editing needs somewhere to write.

| Flow              | Unbound | Why                                       |
| ----------------- | ------- | ----------------------------------------- |
| Search and answer | Works   | Reads the vault, writes nothing           |
| Run a command     | Works   | Its effect is to open a note, which binds |
| Edit the note     | Refused | There is no note to edit                  |
| Load a skill      | Works   | Reading instructions writes nothing       |

Running a command is the interesting case. A command that opens a note binds the
session to it, so an unbound session can reach a bound state on its own, through
the retargeting the harness MVP already built.

## Requirements

FR1. Start a session when no note is open, rather than refusing.

FR2. Show in the panel that no note is bound, distinctly from a note named.

FR3. Bind the session to the first note the user opens, through the existing
active-note wiring.

FR4. Answer questions and search the vault from an unbound session.

FR5. Refuse an edit in an unbound session, telling the model no note is open so
it can say so rather than retrying.

FR6. Let a command run in an unbound session, and bind the session to the note
it opens.

FR7. Keep the rebind prompt for a bound session, unchanged.

FR8. Rename the command, so it no longer promises a session for the active note.

## Non-functional requirements

NFR1. A bound session behaves exactly as it does today. The binding becomes
nullable; nothing else about it changes.

NFR2. No new failure mode when a note is open. The path a bound session takes is
the path it takes now.

NFR3. The prompt tells the model whether a note is bound, so it answers from
what it can do rather than attempting an edit that must fail.
