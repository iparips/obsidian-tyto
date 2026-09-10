---
created: 2026-09-10
updated: 2026-09-11
---

# Design: Document Shape

What the transcript is made of, in the engine's own vocabulary. How it is built
is [3b-wiring.md](3b-wiring.md).

## The two groupings

The engine's own vocabulary decides the document's shape. A conversation turn is
one utterance, run by ConversationTurnRunner (Engine). A turn step is one pass
of its loop: one model call, then the batch of tool calls that came back.

A turn step is not a panel step. One turn step returning three tool calls
publishes three TurnStep (Engine) entries, so the panel's numbered list runs
ahead of the engine's iterations.

The document follows that nesting: metadata, then one section per conversation
turn holding its utterance, its turn steps and the outcome, then an appendix of
prompt parts.

Not everything a turn does sits in a step. TurnRunnerFactory (Engine) resolves
the target note, collects its AGENTS.md chain and lists skills before the loop
starts, and the chain narrates itself through instructionsResolved. That lands
in a Setup block ahead of the turn's first step, rather than inside a step no
model call produced.

A turn step carries three labelled blocks, in the order runTurnStep runs them:

- Request to model: the prompt parts, cited by version, then what is new in the
  chat history since the step before.
- Response from model: the tool calls returned, or the text ending the turn.
- Harness: the panel steps that running those tool calls produced, closing on an
  Outcome line.

The blocks chain: a step's Harness block is what the next step's Request carries
as its tool result. Citing parts by version rather than quoting them keeps a
repeated step to a few lines.

The Outcome line sits in Harness because the harness is what decides whether the
turn goes on. ConversationTurnRunner (Engine) spends the step budget, watches
for the same refusal twice, reads a text response as the reply, and catches a
provider failure or a cancel. The model never ends a turn, so a step that ends
one is a harness verdict on what the tool calls returned.

Most steps carry continue. The step that ends the turn names the ending and the
message the user got.

Which of the five endings it was cannot be read off PanelState, nor off the
Outcome (Shared) the turn returns: TurnOutcomes (Engine) builds exhausted and
stuck as the same chat failure, so both reach the panel as one message with no
kind. Only the runner holds the distinction, so it takes TranscriptRepository
(Session, new) as a seventh constructor argument and records the verdict on each
return path, including the step it was reached at. Outcome stays as it is: it is
the repo's universal result type, and widening it for one feature would reach
every package that returns one.

## What a turn step sends

ModelRequestMapper (Model) builds four parts per model call, in this order:

| Part           | Changes                                        | Stored as                          |
|----------------|------------------------------------------------|------------------------------------|
| System prompt  | On a skill load or an AGENTS.md resolve         | Once per distinct text, then cited |
| Chat history   | Grows per step, and holds the model's replies   | Not stored; already in the session |
| Date message   | Across local midnight only                      | Once per distinct text, then cited |
| Session target | Every step, re-read from the editor by design   | Once per distinct text, then cited |

The history is the spine. Each recorded step holds the range of history it was
sent, firstMessage and lastMessage, so the export walks the history once and
slots each step's inputs in at the right offset, writing no message twice.

That range is an index into SessionRepository (Session), which is the one
coupling this design creates: the store is only meaningful beside the history it
points into. The two are built together in SessionBuilder (Session) and reset
together, so nothing today can separate them. Anything that later writes a
session down has to write both, and restore both, or every step cites the wrong
slice.

Distinct text is what makes a version, so the reported session keeps two system
prompts across twenty turn steps: it loaded a skill in step 7.

## Finding the turn step boundary

PanelReducer (Session) appends every published step into one flat steps entry
per turn, and PanelAction (Session) marks no boundary between turn steps, so the
nesting cannot be read off PanelState alone.

No new event is needed. ModelService (Engine) records a turn step before
ConversationTurnRunner (Engine) runs the tool calls, and every panel step comes
of running them. So the panel steps published between one recording and the next
are the ones that step owns, and anything before the first recording is Setup.

A recorded step stores that as an explicit range, firstPanelStep and
lastPanelStep, closed when the following step is recorded or the turn ends.
Not a running count read at record time: a count only means anything while the
same process is publishing, so a session restored from disk would give every
step the same boundary. A range is a fact about the entries themselves and
survives being written down. Every panel step passes through publishStep in
SessionProgress (Session), which is what advances the open range, so the
engine's publish path, PanelAction and PanelReducer are untouched.
