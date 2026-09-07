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

What it holds

- The turn loop: cancellation check, model call, logging, text-versus-tools
  branch, tool execution, refusal counting, budget spend, low-budget warning.
- Four ways to end a turn, each with its own conclude method.

What changes

- The loop body is one iteration, and could be extracted as such. What survives
  in runAgentLoop is the for statement and the exhausted case.
- The awkwardness is that an iteration either ends the turn or continues it, so
  the extracted function returns an outcome or null.

Risk

- Medium. It grew when repeated-refusal stopping was added, and it is the
  hottest path in the codebase. The null-or-outcome return is less readable
  than the current inline returns, so this may not be worth doing.

## Not candidates

tool-schemas.ts, prompt-builder.ts and rule-builder.ts are long because they
hold declarations and prose. Their functions are short and branch once or not
at all.

tool-dispatcher.ts is 164 lines across 18 functions, none longer than 16 lines.
It is over the file limit and under every other one, which is what a file that
does one thing at a consistent altitude looks like.
