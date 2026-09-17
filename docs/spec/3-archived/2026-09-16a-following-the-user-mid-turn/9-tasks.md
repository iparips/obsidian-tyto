---
created: 2026-09-16
updated: 2026-09-16
---

# Tasks

Four commits. The first is independent. The middle two must land together: the
boundary without the whole-note write makes archiving twelve model calls, and
the write without the boundary leaves the batch that caused this.

## Commit 1: a turn keeps the note it started on

- EditEngine.retargetRunningTurn goes, with the resolve it performs
- ConversationTurnRunner.retargetTo goes with it, since nothing else calls it
- The session bind and the panel entry stay, so the header follows the user and
  the next turn resolves the new note through the path every turn already uses

A command retargeting mid-turn is untouched. ToolDispatcher reaches the turn
repository directly, which is a different route from the one being removed, and
archived specs 31 and 32 depend on it.

Tests: followActiveNote moves the session target, reports it, and leaves a
running turn on its own note.

## Commit 2: one edit per step

- ToolCallExecutor.executeToolCalls counts the edit calls it has run and refuses
  the second, before it reaches the dispatcher
- The refusal names the boundary rather than the anchor, since an anchor that was
  never tried is not what went wrong
- The count is per step, so a turn still makes as many edits as the instruction
  needs

The refusal is not recorded against RepeatedRefusalCounter. Two identical
refusals end a turn, and a batch of three edits produces the boundary refusal
twice, so recording it would turn a deferral into a stuck turn.

Tests: a second edit in a batch is refused and the first applies, a search call
between two edits does not count, the next step's edit applies, and a batch of
three does not end the turn.

## Commit 3: the whole-note write

- A fourth edit tool taking the full content and the content the model last
  read, with a fourth EditOperation kind, a NoteEditor branch, a
  NoteOperationParser case, and the name added to ToolCall.isEditTool so the
  step boundary covers it
- NotesReadRepository is built by TurnRepository itself, as
  NotesChosenByUserRepository is in its field initialiser rather than its
  constructor parameters, and written by HarnessToolsService.readNote
- Three guards in order: refuse unless read this turn, refuse when the note has
  moved under the content carried, then confirm through NoteChoiceService

The order is the design's, not an implementation detail. A user asked to confirm
a write that was about to be refused has been asked for nothing.

Tests: each guard refuses for its own reason, the refusals come before the
confirmation, and a confirmed write replaces the note and reports what it did.

## Commit 4: the prompt

- ModelsRole narrows "Never rewrite the whole note", stops asking for a batch of
  edits, and says why the boundary exists
- The todo skill's archive workflow says it is a whole-note operation

A prompt change is a behaviour change in this repo, so this commit is the one
that cannot be judged from the tests. 4-acceptance-criteria.md holds the checks,
and the second of them is the one that says whether the model reaches for the
right tool.

The checks a person runs are in [4-acceptance-criteria.md](4-acceptance-criteria.md).
