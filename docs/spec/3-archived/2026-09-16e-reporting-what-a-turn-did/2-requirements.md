---
created: 2026-09-16
updated: 2026-09-16
---

# Reporting What A Turn Did

## Motivation

Two sessions on 2026-09-16 were copied out of the panel because they read
wrongly. One claimed an edit was already applied on the turn that applied it.
The other died on an API 400 the user never caused. A third defect was found
reading the code behind them: a retarget after a restore lands in the turn above
the restore marker.

All three are reporting defects. The edit landed, the command ran, the session
retargeted. What the model and the user were told about it was wrong.

Two of the three are one defect wearing two faces. Recording a retarget gave it a
step and a history message, and each home fails in its own way. D1 makes it a
session event instead, the way a restore already is, and both faces go.

## In Scope

Three defects, each reproduced against the code before being written up. Two of
them share a cause, and D1 answers both with one change.

### How a retarget is narrated

Recording a retarget gave it two homes: a step in the panel, and a system message
appended to the chat history. Each home produces a defect.

#### It splits a tool call from its result

EditEngine.followActiveNote appends the message the moment Obsidian fires
file-open. A command that opens a note fires it while the tool is still running,
so the message lands between the assistant tool-call message and the tool result.

The provider rejects the sequence. Mistral answered `Unexpected role 'tool'
after role 'system'` and the turn ended as failed.

Roles sent on the call that failed:

| Position | Role      | Carries                   |
| -------- | --------- | ------------------------- |
| 3        | assistant | the run_command tool call |
| 4        | system    | the retarget message      |
| 5        | tool      | the command's result      |

#### After a restore it lands in the wrong turn

PanelReducer.withStep appends to the last steps entry after the last user entry.
A restored panel ends with a restored entry, and the user entry it needs sits
above it. A retarget arriving before the first new utterance is therefore
appended to a turn that finished before the restore.

The user is shown a change to a section of the log that predates the restore.

A retarget needs a home that needs no slot in the history and no turn to own it.
A restore already has one: its own entry kind, reaching the panel and the
transcript, never the model. D1 gives a retarget the same shape, so it stops
being a step and stops reaching the model.

### An unknown tool name is dispatched to the edit tool

ToolDispatcher.execute routes anything that is not a harness tool to
NoteEditTool. A name it does not recognise reaches NoteOperationParser, which
answers `unknown tool <name>` and the call is refused.

The session that showed this had the model send its whole reasoning text as a
function name, alongside a valid replace_text in the same batch. The batch ran
both: the first refused, the second applied. The model read `applied` as
evidence of an earlier edit and replied that the edit was already applied.

Two writes fall out of it, in that order of importance.

- A name no tool carries is refused as unknown, before the dispatcher routes it
  anywhere. TOOL_SCHEMAS already names every tool, so the check is against a
  list that exists. The refusal names the tools the model may call rather than
  echoing the name back, which the failing session repeated three times in one
  history.
- An applied edit names the operation and the note it reached, so two results in
  one batch are told apart. NoteEditTool answers the bare string `applied`,
  which carries no tense and no target.

The first is the fix. Refusing early means a malformed call produces one result
rather than two, so there is no second result to misread. The second narrows
what a batch can be misread as, and is worth having on its own.

## Steps to Replicate

Each was reproduced by a temporary test run against the tree, then removed.

The 400. Bind a session to a note, then have the model call run_command with a
command that opens another. The file-open handler fires while the tool runs, and
the next call carries system, user, assistant, system, tool.

The phantom edit. Have the model send two tool calls in one batch: one named
something that is not a tool, one a valid replace_text. Both run.

The misplaced retarget. Restore a session whose entries end user, steps,
assistant, restored, then publish a retarget step before the first new
utterance. It joins the steps entry at index 1, above the restored marker.

## References

### Task

- [src/engine/edit-engine.ts](../../../../src/engine/edit-engine.ts) - open first: followActiveNote appends the system message that splits the pair
- [src/engine/tool-dispatcher.ts](../../../../src/engine/tool-dispatcher.ts) - the fall-through to NoteEditTool, and where the unknown-name refusal goes instead
- [src/engine/tools/tool-schemas.ts](../../../../src/engine/tools/tool-schemas.ts) - TOOL_SCHEMAS, the defined names a call is checked against, and ToolCatalogue.forCapabilities, the narrower set the refusal lists
- [src/session/models/panel-state.ts](../../../../src/session/models/panel-state.ts) - the entry union holding the restored kind, and openStepsAt scoping to the last user entry
- [src/session/models/restored-text.ts](../../../../src/session/models/restored-text.ts) - the session event a retarget would copy, and why it exists at all
- [8-transcripts.md](8-transcripts.md) - the two reported sessions, kept whole because the tool results are the evidence

### Project

- [recording-a-retarget](../2026-09-16d-recording-a-retarget/1-index.md) - added the retarget step and the history message; its D2 is reversed by D1 here and needs amending
- [following-the-note-across-a-restore](../../3-archived/2026-09-14h-following-the-note-across-a-restore/1-index.md) - the earlier finding that a past-tense note in the history drags the target back
