# Choosing the Note: Testing Strategy

Unit test outline for [3-component-design.md](3-component-design.md). Follows the
repo's conventions: one dedicated case per branch, named "does X when Y".

Two properties carry the risk. A note the user has not chosen must not open,
which the dispatcher tests directly. And the two scopes must not leak into each
other: a chosen note expiring with the turn and a found note surviving it are
one test each, and a suite that shares one fixture between them proves neither.

## Table of Contents

1. [NoteChoice (Engine, new)](#notechoice-engine-new)
2. [ChosenNotes (Engine, new)](#chosennotes-engine-new)
3. [HarnessTools (Engine, changed)](#harnesstools-engine-changed)
4. [ToolDispatcher (Engine, changed)](#tooldispatcher-engine-changed)
5. [PanelReducer (Session, changed)](#panelreducer-session-changed)
6. [RuleBuilder (Engine, changed)](#rulebuilder-engine-changed)
7. [EditEngine (Engine, changed)](#editengine-engine-changed)

## NoteChoice (Engine, new)

- Returns the path the user picked when they pick one.
- Names every candidate in the question when a shortlist is offered.
- Returns null when the user declines every candidate.
- Holds a path the user picked, so a later open needs no question.
- Holds no path when the user declined, so nothing opens on a decline.
- Holds no path never offered, so one pick does not license another note.
- Asks again for a second, different note, so one pick is about one note.
- Asks once for a note already picked this turn.
- Returns the first candidate without asking when constructed automatic.
- Holds the first candidate when constructed automatic, so auto mode opens it.
- Declines when the turn is cancelled rather than answered.
- Settles rather than parking the loop when the turn is cancelled.

## ChosenNotes (Engine, new)

- Excludes every path when nothing has been chosen.
- Includes a path the user chose.
- Excludes a path the user did not choose.
- Keeps a path from an earlier choice when a second is recorded.

## HarnessTools (Engine, changed)

- Runs a choice when choose_note is called.
- Offers only the candidates a search returned, so an invented path is dropped.
- Refuses the call when no candidate was returned by a search, naming them.
- Refuses the call when the paths list is empty.
- Reports the choice as a step, naming how many notes were offered.
- Omits choose_note from the schemas when search is disabled.
- Omits choose_note from the schemas in auto mode.
- Offers open_note beside it, since choosing and opening are separate calls.

## ToolDispatcher (Engine, changed)

- Records the chosen path when the user picks one.
- Tells the model which path was chosen when the user picks one.
- Tells the model to ask what they meant when the user declines every candidate.
- Leaves the target note where it was when the user declines.
- Spends no open budget when the user declines, so a second shortlist can still open.
- Opens a note the user chose this turn.
- Refuses an open of a note the user has not chosen, naming choose_note.
- Refuses an open of a path no search returned, naming the search rather than the choice.
- Reopens a note already chosen without asking again, so a command that moved the target costs no second question.

## PanelReducer (Session, changed)

- Renders a choice entry when a shortlist is offered.
- Holds every candidate in the entry when a shortlist is offered.
- Holds the purpose in the entry, so the user reads what they are agreeing to.
- Names the picked note when the choice is answered.
- Says the shortlist was declined when the user declines.
- Settles a pending choice when the turn ends, so no live list outlives its turn.
- Renders no confirm entry, since that kind no longer exists.

## RuleBuilder (Engine, changed)

- States choosing in the order to try, between grepping and opening.
- Tells the model one candidate is still the user's to confirm.
- Tells the model to ask what they meant when a shortlist is declined.
- Mentions the retired confirmation nowhere.
- Produces the release 3 prompt byte for byte when commands and search are both absent.

## EditEngine (Engine, changed)

- Offers a shortlist and edits the note the user picked, end to end.
- Applies no edit when the user declines every candidate.
- Asks the user what they meant after a decline, rather than searching again.
- Reopens a chosen note after a command moved the target away, without asking twice.
- Asks again in a second turn for a note chosen in the first, since consent is per turn.
- Opens a note found in an earlier turn without re-searching, since finding is per session.
- Opens what the model found without asking when the vault is in auto mode.
