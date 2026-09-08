# Candidates

Three functions, ranked by how far past the 20-line limit they sit. Each entry
says what it does now, what it would become, and what the change risks.

## 1. The SessionPanel component (done)

Was 83 lines of hook wiring above the JSX, now 51.

What changed

- useEngineEvents took the five subscriptions the panel only forwarded to the
  reducer: hidden, instructions, warnings, steps and answers.
- useTargetNote took the sixth, which owns state rather than dispatching: the
  header reads the target note directly, and no panel action changes it.
- Both declare their own ports interface, which SessionPanelProps extends. The
  props the panel no longer reads are gone from it.

What it left

- The component holds the reducer, the draft, the turn, the cancel control and
  the markup. Every remaining line is something the panel decides.

## 2. PanelReducer.reduce

64 lines, 16 cases, in session/models/panel-state.ts.

What it holds

- One switch over every panel action: recording, transcript, summary, failure,
  instructions, warnings, steps, answers, cancellation, choices, questions.

What changes

- The cases group by subject. Recording and transcription are the capture
  lifecycle; choice and question are the two parked answers; steps, answers and
  instructions are entries appended to the history.
- Three smaller reducers, dispatched by group, would put each under 20 lines.

Risk

- Medium. A reducer is the one place where seeing every transition at once has
  value, and splitting it means a reader follows two hops to find a case. Worth
  weighing against the line count rather than assuming the limit wins.

## 3. EditEngine.runAgentLoop

35 lines, in engine/edit-engine.ts.

Extracting the loop body would leave runAgentLoop as a for statement and the
exhausted case, but an iteration either ends the turn or continues it, so the
extracted function returns an outcome or null. That reads worse than the
current inline returns.

The line count is the wrong thing to chase here. [4-edit-engine/1-index.md](4-edit-engine/1-index.md)
sets out the five responsibilities the class carries, and which of them is worth
extracting first.

## Not candidates

tool-schemas.ts, prompt-builder.ts and rule-builder.ts are long because they
hold declarations and prose. Their functions are short and branch once or not
at all.

tool-dispatcher.ts is 164 lines across 18 functions, none longer than 16 lines.
It is over the file limit and under every other one, which is what a file that
does one thing at a consistent altitude looks like.
