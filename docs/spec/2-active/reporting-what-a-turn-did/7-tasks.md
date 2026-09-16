---
created: 2026-09-16
updated: 2026-09-16
---

# Tasks

Three commits. The first two are independent of each other and of the third, so
the order below is by how much each changes rather than by dependency.

The retarget work is one commit, not two. Removing the history message and adding
the entry kind must land together: between them a retarget would reach nothing,
which is the state before recording-a-retarget shipped.

## Commit 1: a retarget becomes its own entry

- PanelEntry gains the retargeted kind, PanelAction the retargeted action, and
  PanelReducer a case appending it. The case sits beside instructions and
  warned, which it resembles, and does not go through withStep
- RetargetedText builds the line from a path and answers the unbound case, as
  RestoredText answers a missing stamp
- EntryWeights maps the kind to context, HistoryEntry gains its class, and
  TranscriptEntryLines a case rendering it as a line
- useEngineEvents forwards onTargetNoteChanged to the new action. The port is
  already exposed; today only useTargetNote reads it, for the header
- EditEngine.followActiveNote drops the appendChatMessage call and the
  retargetMessage factory
- SessionProgress.retarget drops the publishStep call, keeping the
  retargets.publish that moves the header
- TranscriptTurn.split stops dropping entries before the first utterance, or
  they render through the setup path TranscriptTurnSection already has

The snapshot needs no change: its filter names restored alone, and a retarget is
stored because it happened once rather than being added afresh on every restore.
SESSION_SNAPSHOT_VERSION does not move, since no existing field changes meaning.

This retires both the 400 and the misplaced step. Nothing is appended to the
history, so no tool pair can be split; nothing is a step, so no turn has to own
one.

Tests: the reducer case, followActiveNote appending nothing, the regression test
that a command retargeting mid tool call sends no system message between a tool
call and its result, and split keeping what precedes the first utterance.

## Commit 2: an unknown tool name is refused before dispatch

- ToolDispatcher.execute gains a guard ahead of the load-skill branch, since a
  name no tool carries is not a load_skill either
- The guard checks TOOL_SCHEMAS, the defined names, so a tool a disabled
  capability withheld still reaches the branch refusing it by name and reason
- The refusal lists the offered set, from ToolCatalogue.forCapabilities, which
  HarnessToolsService already calls for the schemas sent with each request. The
  dispatcher reads that list rather than holding a second copy
- The refusal names the tools that may be called and not the name it was sent

NoteOperationParser keeps its own unknown-tool branch. It is unreachable from
the dispatcher once this lands, and it is the parser's exhaustiveness rather
than a second gate.

Tests: an unoffered name is refused naming the offered tools, the refusal does
not repeat what it was sent, a refused step is published, and neither
NoteEditTool nor the harness tools are reached. Plus the batch case: an unknown
name beside a valid edit still lets the edit apply.

## Commit 3: an applied edit says what it applied

- NoteEditTool.applyOperation answers a line naming the operation, the note and
  the line the edit ended on, rather than the bare applied string
- ApplyResult already carries endedAt, and the note is in hand as the OpenNote
  the method was given

The content is not echoed: the model sent it one message earlier, and a dictated
paragraph makes that cost unbounded.

Tests: the result names the operation and the note, and does not echo the content.

## Also In This Work

Amend [recording-a-retarget](../recording-a-retarget/1-index.md). Its D1 and D2
are already marked superseded and its index carries the note; check nothing else
in that spec still promises the model half once this lands.

The checks a person runs are in [4-acceptance-criteria.md](4-acceptance-criteria.md).
