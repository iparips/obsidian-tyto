# Model-Chosen Targets: Testing Strategy

Unit test outline for [3-component-design.md](3-component-design.md). Follows
the repo's conventions: one dedicated case per branch, named "does X when Y".

Two properties carry the risk, and each gets its own coverage. A declined open
must leave the vault untouched (NFR1), and every refusal must hold in both modes
(NFR3). The mode is a constructed collaborator rather than a branch, so the
second is tested by running the same refusal cases with a granted approval.

## Table of Contents

1. [SeenPaths (Search, new)](#seenpaths-search-new)
2. [OpenApproval (Engine, new)](#openapproval-engine-new)
3. [PendingAnswer (Engine, new)](#pendinganswer-engine-new)
4. [UserQuestion (Engine, new)](#userquestion-engine-new)
5. [AnswerRequest (Engine, new)](#answerrequest-engine-new)
6. [TurnNotices (Session, new)](#turnnotices-session-new)
7. [HarnessTools (Engine, changed)](#harnesstools-engine-changed)
8. [ToolDispatcher (Engine, changed)](#tooldispatcher-engine-changed)
9. [TurnBudget (Engine, changed)](#turnbudget-engine-changed)
10. [RuleBuilder (Engine, changed)](#rulebuilder-engine-changed)
11. [PanelReducer (Session, changed)](#panelreducer-session-changed)
12. [SessionPanel (Session, changed)](#sessionpanel-session-changed)
13. [EditEngine (Engine, changed)](#editengine-engine-changed)

## SeenPaths (Search, new)

- Includes a path when a search returned it.
- Excludes a path no search returned.
- Includes a path from a second search, so refining a query does not lose the
  first set.
- Excludes every path when nothing has been searched.

## OpenApproval (Engine, new)

- Grants when the supplied question answers yes.
- Declines when the supplied question answers no.
- Asks once for a path already granted this turn, so a second step is not asked
  again.
- Asks again for a different path, so one approval does not waive the next.
- Grants without asking when constructed granted, which is auto mode.

## PendingAnswer (Engine, new)

- Resolves with the answer when the panel answers.
- Resolves with the fallback when the turn is cancelled instead.
- Resolves once when an answer and a cancellation arrive together.
- Passes the question and its suggestions to whoever asks.

## UserQuestion (Engine, new)

- Returns the user's answer when one is given.
- Returns an empty answer when the turn is cancelled.
- Holds nothing between questions, so a second question asks again.

## AnswerRequest (Engine, new)

- Carries the question text.
- Carries no suggestions when none are offered.
- Carries the suggestions when some are offered.

## TurnNotices (Session, new)

- Shows a waiting notice that does not fade.
- Shows a finished notice that fades.
- Shows a failed notice that fades, worded as a failure.
- Shows nothing when the session panel is already visible.
- Dismisses the waiting notice when the answer arrives.
- Reveals the session leaf when a notice is acted on.
- Opens no panel on its own.

## HarnessTools (Engine, changed)

- Refuses an open when the budget is spent, naming the cap.
- Refuses an open when the path was never returned by a search.
- Refuses an open when no note exists at the path.
- Checks the budget before the seen-paths guard, so a spent turn reports the cap
  rather than the path.
- Yields the path to open when every guard passes.
- Records the paths of a search's hits, so a following open is permitted.
- Omits open_note from the schemas when search is disabled, since no path can
  ever be offered.

## ToolDispatcher (Engine, changed)

- Asks for approval before opening a model-chosen note.
- Moves the target note when approval is granted.
- Publishes the retarget when approval is granted, so the header follows.
- Leaves the target note unchanged when approval is declined.
- Calls no note editor when declined, so nothing is written.
- Returns a declined result rather than throwing, so the loop continues.
- Skips the approval when a command opened the note, in confirm mode.
- Skips the approval when a command opened the note, in auto mode.
- Refuses a path the budget forbids without asking for approval, so a refused
  open never interrupts the user.

## TurnBudget (Engine, changed)

- Permits opens up to the cap.
- Refuses an open past the cap, naming it.
- Counts opens separately from commands, so one flow does not spend the other's
  budget.

## RuleBuilder (Engine, changed)

- Instructs the model to prefer a listed command that opens the destination.
- Instructs the model to search only when no command reaches it.
- States the preference identically in both modes, since the mode is not in the
  prompt.

## PanelReducer (Session, changed)

- Moves to the asking phase when a question is requested.
- Returns to the previous phase when the question is answered.
- Renders a question entry carrying its suggestions.
- Keeps a question's text when the turn ends unanswered.
- Drops a question's buttons when the turn ends unanswered.

- Adds a confirm entry when an open is requested.
- Enters the confirming phase when an open is requested.
- Replaces the confirm entry with its outcome when answered yes.
- Replaces the confirm entry with its outcome when answered no.
- Returns to the thinking phase when answered, so the turn reads as still
  running.
- Weighs a confirm entry as a reply, not as context.

## SessionPanel (Session, changed)

- Renders the question text when a question is asked.
- Renders a button per suggestion when suggestions are offered.
- Renders no suggestion buttons when none are offered.
- Fills the input when a suggestion is clicked.
- Answers with the typed text when the user sends while asking.
- Leaves the input live while asking, unlike while thinking.

- Renders the note path beneath the note name.
- Updates both the name and the path when the target note changes.
- Renders approve and decline controls on a confirm entry.
- Disables the input row while confirming, so a second utterance cannot queue
  behind an unanswered question.
- Answers declined when the turn is cancelled while confirming.

## EditEngine (Engine, changed)

- Opens a model-chosen note and edits it, end to end, in auto mode.
- Pauses on the approval and completes the edit once granted.
- Ends the turn without an edit when the approval is declined.
- Reports what stopped when declined, rather than a summary claiming an edit.
- Holds one approval across a two-step instruction, so the edit after the open
  does not ask again.
