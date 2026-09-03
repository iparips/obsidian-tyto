# Tidy Up Chat Panel: Testing Strategy

Unit test outline for [3-component-design.md](3-component-design.md). Follows
the repo's conventions: one dedicated case per branch, named "does X when Y".

Most of this feature is a stylesheet, which a unit test cannot judge. The tests
hold the mapping and the structure; whether it looks right is the exit test.

## EntryWeights (Session, new)

- A user entry is an utterance.
- An assistant entry is a reply.
- An answer entry is a reply, not a weight of its own.
- An error entry is a reply, so a failure sits where the user is looking.
- An instructions entry is context.
- A command entry is context.

One case per kind, since the mapping is the whole component and a wrong kind is
a wrong panel.

## HistoryEntry (Session, changed)

- Carries the weight class beside the kind class, so both are available to the
  stylesheet.
- Renders an answer's sources beneath it, as it does today.
- Offers the copy control on a reply, and on an utterance.
- Offers no copy control on a context line (FR7).
- Renders the error's step and message, unchanged from today.

The existing suite covers what each kind says. These cases cover only what
changed, so a case asserting text belongs where it already is.

## PendingEntry (Session, new)

- Names the transcribing wait when the phase is transcribing.
- Names the thinking wait when the phase is thinking.
- Renders nothing when the phase is recording, since the user is speaking.
- Renders nothing when the phase is idle.

## HistoryList (Session, changed)

- Renders the pending line after the entries, so it holds the reply's place.
- Renders no pending line when the phase is idle.
- Renders the pending line for an empty history, so a first turn shows it.

## SessionPanel (Session, changed)

- Renders no return-to-starting-note control, whatever the target note is
  (FR12).
- Renders the target-note name, and the reset control (FR13).
- The existing cases for the return button go with it, rather than being
  rewritten.

## What only the exit test can judge

- Whether the three weights are distinguishable at a glance.
- Whether the bubble reads as the user's own words.
- Whether context lines stack as one block rather than a run of separate lines.
- Whether any of it survives a light theme and a custom theme (NFR1).
- Whether the copy control ever covers the text it copies (FR8).
