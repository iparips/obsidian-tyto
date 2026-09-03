# Sessions Without a Note: Testing Strategy

Unit test outline for [3-component-design.md](3-component-design.md). Follows
the repo's conventions: one dedicated case per branch, named "does X when Y".

The existing suites are the real check on the nullable binding. A bound session
must behave identically (NFR1), so any existing test needing its assertions
edited means behaviour moved where it should not have.

## SessionRepository (Session, changed)

- Reports itself unbound when constructed with no note.
- Reports itself bound when constructed with a note.
- Yields no target note when unbound.
- Binds to a path when the target changes, so an unbound session becomes bound.
- Keeps its chat history when unbound, since a conversation needs no note.

## TargetNoteResolver (Engine, changed)

- Yields no note when the session is unbound, rather than failing.
- Yields the resolved note when the session is bound, unchanged from today.
- Reports no instruction chain when unbound, since a chain resolves from a
  note's folders.
- Still fails when a bound path cannot be located, which is a different case
  from being unbound.

## ToolDispatcher (Engine, changed)

- Refuses an edit when the session is unbound, naming that no note is open.
- Refuses without calling the note editor, so nothing is written.
- Runs a search when unbound, since searching needs no note.
- Loads a skill when unbound.
- Runs a command when unbound, and binds the session to the note it opens.
- Applies an edit normally once bound, unchanged from today.

## PromptBuilder (Engine, changed)

- States that no note is open when the session is unbound.
- States the bound note when the session is bound, unchanged from today.
- Offers the edit tools in both, so the model can explain a refusal rather than
  finding the tool missing.

## EditEngine (Engine, changed)

- Answers a question in an unbound session, end to end.
- Reports that no note is open when an unbound turn asks for an edit.
- Edits normally once a note is opened mid-session.

## SessionPanel (Session, changed)

- Says no note is bound when the session is unbound.
- Names the target note when bound, unchanged from today.

## OwlPlugin (Plugin, changed)

Not unit tested today, and this feature does not add a harness for it. The guard
removal and the command rename are covered by the exit test.
