# Proposal: Six Engine Sub-Packages

Six folders, named for what the code in them is about rather than what kind of
thing it is. The models folder dissolves, so each value object sits beside the
code that gives it meaning.

## The six

### turn/ - what one turn scopes and spends

- TurnFactory, TurnRepository, TurnCancellation (Engine)
- Turn, TurnBudget, IterationBudget, RepeatedRefusal, ChosenNotes (Engine)

The strongest cluster. The three counters all answer "what may this turn
spend", and today they sit apart from the repository owning their lifetime.

### note-editing/ - how a note is changed

- NoteEditor, NoteOperationParser, PositionConverter (Engine)
- NoteDetails, OpenNote (Engine)

The editor mechanics, below the tool surface. Nothing here takes a ToolCall:
NoteOperationParser (Engine) is what turns one into an EditOperation, and
NoteEditor (Engine) applies that to an Obsidian editor.

### tools/ - what the model can call

- HarnessTools, SearchTools, ShortlistTool, NoteEditTool (Engine)
- HarnessResult, TurnState, Refusal, ToolSchemas, ToolCallOutcome (Engine)
- AnswerRequest, ChoiceRequest (Engine)

HarnessResult (Engine) defines the contract every tool returns, so it belongs
with them. ToolSchemas (Engine) is 281 lines, the largest file in the package,
and is purely the offered surface.

replace_text, insert_text and insert_at are schema tools like any other. They
are absent from isHarnessTool (Providers) because they are the dispatcher's
fallthrough branch, not because they are a different kind of thing. So
NoteEditTool (Engine) belongs here, beside the tools it is dispatched with.

This puts tools/ at nine files, over the seven-file guide. Splitting it further
would separate the schema from the code that answers it, which costs more than
the overrun.

### waiting/ - what parks a turn on a person

- PendingAnswer, NoteChoice, UserQuestion (Engine)

### prompting/ - what the model is told

- PromptBuilder, RuleBuilder, Today (Engine)

RuleBuilder (Engine) imports nothing at all. Together 402 lines of text
assembly, unrelated to the rest of the package.

### note-binding/ - which note the session points at

- TargetNoteResolver, WorkspaceNoteLocator, NoteOpener (Engine)
- ResolvedNote (Engine)

The path-to-editor chain. A path survives between turns; an editor handle goes
stale, and this is where one becomes the other.

## What stays at the root

EditEngine, ToolDispatcher, EngineFactory, TurnProgressPublisher and TurnStep
(Engine). The loop, its dispatcher, the wiring, and the channel every
sub-package reports progress through.

Root files are the ones that span groups by design. Keeping them unfoldered
says so.

## What decides whether something is a tool

Being in the schema does not settle it. Editing, searching, choosing and asking
are all declared tools, so that test puts four of the six folders in one.

The test that separates them: does the class take a ToolCall and return a
ToolCallOutcome. NoteEditTool and HarnessTools (Engine) do, so they are tools.
NoteEditor (Engine) takes an EditOperation and NoteChoice (Engine) takes a
ChoiceRequest, so neither is.

That line puts the tool surface in tools/ and the machinery each tool drives in
the folder named for what it does.

## The open question: waiting/ or tools/

Both ask_user and choose_note are tools. They sit in the schema and dispatch
through HarnessTools (Engine) like any other call. That is the case for folding
waiting/ into tools/.

The case against is what the call graph shows. ToolDispatcher (Engine) is the
only runtime caller of NoteChoice and UserQuestion (Engine), at three call
sites. PendingAnswer (Engine) has no caller outside those two.

| Axis               | Fold into tools/                     | Keep waiting/ separate                         |
| ------------------ | ------------------------------------ | ---------------------------------------------- |
| Schema             | Both are declared tools              | Same, so this axis does not separate them      |
| What the code does | Runs and returns                     | Suspends until a person answers                |
| Who calls it       | HarnessTools dispatches              | ToolDispatcher awaits, after the tool returned |
| Constructed by     | EngineFactory, once                  | TurnAskers (Session), per turn                 |
| Cost of folding    | tools/ reaches 9 files, near the cap | Six folders instead of five                    |

Recommendation: keep waiting/ separate.

The tools return a request value and finish. Something else then suspends the
turn until a human settles it. ShortlistTool (Engine) building a ChoiceRequest
is tool work; NoteChoice (Engine) awaiting the pick is not.

The seam is already drawn outside the engine. TurnAskers (Session) constructs
both, because only the panel can answer. That file names the boundary, and
waiting/ is the engine side of it.

AnswerRequest and ChoiceRequest (Engine) go to tools/ for the same reason.
ShortlistTool (Engine) constructs a ChoiceRequest, and splitting a producer
from what it produces is the inconsistency this placement avoids.

## Cost

Every import path inside the engine is rewritten. Three files outside it also
change: main.ts, test-support/builders.ts and session/turn-askers.ts.

The code generation rules put renames in their own commit. This is the same
shape, so it lands as a move that touches nothing else.
