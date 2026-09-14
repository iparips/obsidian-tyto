---
created: 2026-09-10
updated: 2026-09-10
---

# Test Plan

TranscriptDocument and TranscriptRepository are both pure, so the format and the
deduplication are covered without a DOM, a clipboard or a model.

## TranscriptDocument

- The metadata table names the note, the model and the search setting, and
  never the API key
- An utterance, a steps list and an error render in the order they happened
- Every Entry kind renders: answers with sources, choices with what was picked,
  questions with what was answered, cancellations, warnings, instructions
- A steps entry renders each step with its detail, and marks the refused ones
- A part whose text repeats appears once in the appendix, cited by both steps
- A part whose text changes mid-session is written as a diff against the version
  before it, and diffs against the same part rather than the last one written
- A skill body goes to its own appendix section, cited from the step that loaded
  it, and a refused load stays in the step
- Panel steps published before the first model call render under Setup
- The Outcome block names the ending kind and the turn step count
- A failed turn renders its FailureStep, not a guess at exhausted or stuck
- A turn step nests the panel steps it produced, in order
- A turn step returning two tool calls nests both under one step
- A turn step names the history messages sent since the step before it
- A session with no turn steps renders the metadata and the utterance alone

## TextDiff

- A changed, an added and a removed line are each marked
- Two identical texts collapse to nothing
- A long unchanged run collapses to an ellipsis, keeping the lines either side
- Over 500 generated pairs, the diff reproduces both texts, so nothing is
  invented and nothing is lost
- Over 500 generated pairs, it keeps as many lines as the texts genuinely share,
  checked against a reference longest common subsequence

The two generated cases are why the diff is written here rather than taken from
a library: they are what makes owning 24 lines of longest-common-subsequence
cheaper than a runtime dependency in a plugin that ships two.

## TranscriptRepository

- A recorded turn step holds the history range it was sent
- A recorded turn step holds its panel step range, closed by the next recording
- Two turn steps either side of a batch own the panel steps between them
- A turn ending closes the last step's open panel range
- Recording the same prompt text twice keeps one version
- Recording a changed note context keeps both, in order

## ConversationTurnRunner

- Each of the five endings is recorded: exhausted, stuck, replied, failed,
  cancelled
- A recorded ending holds the turn step the harness decided it at

## PanelHeader

- The button is absent when the setting is off
- The button disables while a turn runs, and while there are no entries
- Clicking it writes to the clipboard and shows the copied label

## Not covered here

That a pasted transcript reads as the session did is a format judgement rather
than a behaviour, and belongs in the manual tests under docs/manual-tests.
