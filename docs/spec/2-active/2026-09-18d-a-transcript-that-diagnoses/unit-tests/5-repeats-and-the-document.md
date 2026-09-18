---
created: 2026-09-18
updated: 2026-09-18
---

# Repeats And The Document

## RepeatedCalls.of

The same-call-and-same-result test D3 settled, computed at export time from what the history already holds.

```text
walk the turn's steps in order
  key = name + stringify(args) + result
  first occurrence of a key -> record its step
  later occurrence          -> map the call to the recorded step
```

```text
a turn sending the same call three times, each returning nothing
  leaves the first unmarked
  marks the second as repeating the first
  marks the third as repeating the first, not the second
a turn that grepped, wrote, and grepped the same pattern again
  marks neither grep, since the second returned what the first did not
a turn sending the same tool with different arguments
  marks neither
a turn sending different tools with identical arguments
  marks neither
a call whose result is missing from the history
  marks nothing, since the same-result test cannot be met by an absence
two turns each sending the same call
  marks neither, since the window is the turn and not the session
```

## RepeatedCalls.repeatedStepOf

```text
repeatedStepOf(call) -> the step it repeats, or null
```

```text
a call recorded as a repeat
  names the step it repeats, numbered as the heading numbers it
a call that is the first of its kind
  answers null
a call the turn never sent
  answers null
```

## TranscriptDocument

The format is what a failed session is filed as, so these cases assert on the document rather than on the classes that build it. That is the existing suite's own rule.

```text
a turn step whose reply carried a sentence and two calls
  renders the sentence and both calls under that step
a turn that ended exhausted
  renders the last step's calls
  renders a last step total equal to the budget the ending message names
a turn step whose provider call failed
  says the provider call did not return
  writes no budget line for that step
every step of a turn that went fine
  names what the turn has spent and what the budget is
a step whose reply batched four calls
  names a charge above one and below four
  is followed by a step whose running total includes it
a turn that looped on one call
  marks the recurrence and not the first
a turn that grepped, wrote and grepped again
  marks neither grep
a search that returned nothing with a reason
  renders the reason inside the tool result, and adds no line of its own
a guarded call declaring an empty applicable_skills
  renders the empty list inside the call's JSON
a guarded call omitting applicable_skills
  renders no applicable_skills key, so the two do not read alike
```
