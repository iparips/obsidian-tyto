---
created: 2026-09-18
updated: 2026-09-18
---

# The Response Block

## TranscriptTurnStep.response

The method the nothing-recorded symptom renders from. Three cases replace one.

```text
spoke  = answered.filter(hasToolCalls or isModelText)
budget = charge ? ['- Spend: {charged} charged, {usedAfter} of {budget} used'] : []

spoke empty and no charge  -> budget + ['- no reply recorded: the provider call did not return']
spoke carried nothing      -> budget + ['- the model returned an empty reply']
spoke empty and charged    -> budget + ['- nothing recorded']
otherwise                  -> budget + spoke.flatMap(responseLines)
```

A reply carrying neither text nor calls is a message in the slice rather than an absence from it. MistralMapper.toChatTurn (Model Providers) maps it to ChatTurn.ofText with an empty content, so the turn ends through TurnEndingService.endTurnWithModelUtterance (Engine) and the history keeps an assistant message whose content is empty. The middle case therefore tests the message rather than the slice, which is what tells it from the failed provider call above it.

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
