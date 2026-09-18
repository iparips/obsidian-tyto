---
created: 2026-09-14
updated: 2026-09-15
---

# Following The Note Across A Restore: Spec

"Clear my shopping list" edited yesterday's daily note, then failed because that
note was not open. The session had been restored hours earlier onto the note it
was bound to, and the user had moved on.

- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it
- [2-requirements.md](2-requirements.md) - the rule, the three paths that disagree with it, and the scenarios
- The reported session's transcript - removed: held personal vault content, kept whole because the repeated steps are the evidence
- [4-design.md](4-design.md) - the seam in SessionBuilder, what asks the workspace, and what goes
- [5-tasks.md](5-tasks.md) - build order in three commits, and what to measure first

One rule: a session is bound to the open markdown note, or to null when nothing
markdown is open. It holds whether the session is new, restored, or already
running.

The rule is not new. EditEngine.followActiveNote already says a note the user
opened themselves is as much a retarget as one a command opened, and rebinds
silently mid-session. What this spec does is apply that to the two entry points
written before it existed.

Restoring never looks at the workspace: openSession returns the moment a stored
session binds, and the active file it read one line earlier is discarded.
Starting a session on another note prompts instead, through a modal whose only
rebind option also drops the conversation.

Reading the workspace at bind time also closes the listener gap. The file-open
subscription belongs to an engine, so a note opened while no panel existed is
invisible forever. What is open has an answer at any moment, so the binding need
not be reconstructed from the events that led there.

The rebind prompt goes, reversing "no implicit rebinding" from
[desktop-mvp](../../3-archived/2026-08-28a-desktop-mvp/5-settings-ui.md). That decision
predates the active-note wiring in
[sessions-without-a-note](../../3-archived/2026-09-03d-sessions-without-a-note/1-index.md).
Nothing is lost by rebinding: the conversation is the session, the binding is
not, so there is no loss to warn about.

One half the rule does not reach. The model re-ran the command that bound the
session, dragging the target back mid-turn.

It did not do that out of confusion about whether the command had run: a tool
call sits in history as a completed exchange by construction. It re-ran it
because the prompt asks for a command when an utterance names a destination, the
replayed turn 1 demonstrated that exact sequence, and NoteContextMessage named
the daily note last and said it superseded everything above.

Binding to the open note removes the third of those, which is the one closest to
the decision. Whether that is enough on its own is the question to measure
before touching CommandSection.

No test covers the retarget wiring, because main.ts has none. Any fix has to
answer where that behaviour becomes testable.
