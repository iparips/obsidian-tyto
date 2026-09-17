# Tasks

Three commits. The first stands alone and is worth having whatever happens to
the rest.

## Commit 1: the edit step names its note

TurnStep.edited takes the path alongside the result, and ToolDispatcher reads
the target it already holds to supply it.

- TurnStep.edited(result, path) builds a step naming the note
- recordEdit passes turnRepository.targetNote()?.path
- A refused edit keeps the step it has

Nothing else changes, so the suite stays green apart from the TurnStep tests
that assert the old text.

## Commit 2: the guard goes

TurnRepository loses noteTheTurnStartedOn, reachedOut, openedThisTurn, mayEdit,
searchRan and logRefusal. NoteEditTool edits the target it reads.

- SearchToolsService drops its two searchRan calls
- TurnState drops searchRan from the interface
- The unwritable-note check in NoteEditTool stays

## Commit 3: the running turn follows the user

EditEngine.followActiveNote retargets the turn it is running, where one is
running.

- EditEngine takes a TargetNoteResolver, appended to its constructor
- EngineFactory and the test builder pass the resolver they already build
- Resolve after the session target moves, since the resolver reads it
- Retarget the running turn on success, through retargetTo
- A failed resolve leaves the turn where it was, as a command already does
- The session target moves either way, which is today's behaviour

followActiveNote becomes async, so the caller in OwlPlugin.retargetActiveEngine
either awaits it or fires and forgets. It is an event handler, so it does not
await today.

## Tests

Removed, since they assert the guard.

| Test                                                                     | In                       |
| ------------------------------------------------------------------------ | ------------------------ |
| refuses an edit to the inherited note once the model has searched        | edit-engine-model-chosen |
| tells the model to open the note before editing when it skipped the open | edit-engine-model-chosen |

Kept unchanged, since they assert what still holds.

| Test                                                         | In                       |
| ------------------------------------------------------------ | ------------------------ |
| edits the inherited note when no search has run              | edit-engine-model-chosen |
| applies the edit once the note is actually opened            | edit-engine-model-chosen |
| refuses the open when the path was never offered by a search | edit-engine-model-chosen |

New, one per branch.

- Names the note in the step when an edit lands
- Edits the note the turn started on after a search, since the target has not moved
- Edits the note the model opened after a choice, since the open moved the target
- Edits the note the user opened mid-turn, since the running turn followed it
- Leaves the turn on its note when a mid-turn open will not resolve

## Exit test

Needs a real vault, on mobile. With a note open, ask for a change to a note
elsewhere in the vault. Let the model glob and choose, and confirm the panel's
edit step names whichever note the edit reached.
