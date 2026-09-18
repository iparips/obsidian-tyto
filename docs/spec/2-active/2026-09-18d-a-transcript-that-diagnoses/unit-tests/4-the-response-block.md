---
created: 2026-09-18
updated: 2026-09-18
---

# The Response Block

## TranscriptTurnStep.response

The method the nothing-recorded symptom renders from. Three cases replace one.

```text
lines  = answered.filter(hasToolCalls or isModelText).flatMap(responseLines)
budget = charge ? ['- Spend: {charged} charged, {usedAfter} of {budget} used'] : []

lines empty and no charge -> budget + ['- no reply recorded: the provider call did not return']
lines empty and charged   -> budget + ['- nothing recorded']
otherwise                 -> budget + lines
```

```text
the reply carried text and tool calls
  renders the text and every call, in the order the reply held them
the reply carried tool calls alone
  renders the calls and no text line
the reply carried text alone
  renders the text
the slice is empty and the step drew no charge
  says the provider call did not return, rather than blaming the model
the reply carried neither text nor calls
  says the model returned an empty reply
the slice is empty and the step was charged
  falls back to nothing recorded, which is the harness failing to account for the step
every case
  writes the budget line first where a charge was recorded
  writes no budget line where none was
```

## TranscriptTurnStep.responseLines

```text
message has tool calls -> [text line if content] + call blocks
message has none       -> [text line]
```

```text
a message carrying both
  writes the text line above the call blocks, so the sentence reads before what it did
a message carrying calls and empty content
  writes the call blocks alone, with no blank text line
a message carrying text alone
  writes the text line
a call that repeats an earlier step
  marks the call line with the step it repeats
a call that is the first of its kind
  leaves the call line unmarked
```
