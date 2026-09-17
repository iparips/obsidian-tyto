---
created: 2026-09-16
updated: 2026-09-16
---

# Unit Tests

One entry per production method the design changes. The checks a person runs by
hand are in [4-acceptance-criteria.md](4-acceptance-criteria.md).

## PanelReducer.reduce

```text
retargeted action
  appends its own entry rather than joining the open steps entry
  leaves the phase unchanged
  after a restored entry, appends below it
  with no turn yet, appends without a user entry above it
```

## EditEngine.followActiveNote

```text
the user opens a different note
  moves the target
  reports the move on the retargets channel
  appends nothing to the chat history
the user opens the note already targeted
  reports nothing
a command opens a note mid tool call
  the messages sent carry no system message between a tool call and its result
```

The last case is the regression test for the 400. It was the temporary test that
reproduced the defect, so it lands as written.

## ToolDispatcher.execute

```text
a name no tool carries
  returns a refusal naming the tools that may be called
  does not repeat the name it was sent
  publishes a refused step
  reaches neither NoteEditTool nor the harness tools
a batch holding an unknown name and a valid edit
  the edit still applies
  the results are told apart by what each names
```

## NoteEditTool.execute

```text
an edit applies
  names the operation
  names the note it reached
  does not echo the content it wrote
```

## TranscriptTurn.split

```text
entries before the first utterance
  render rather than being dropped
```
