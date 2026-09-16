---
created: 2026-09-16
updated: 2026-09-16
---

# Binding To The Active Tab: Spec

A new empty tab on mobile left the session bound to the note in the tab before
it. The next instruction edited that note, out of sight.

- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it
- [2-requirements.md](2-requirements.md) - the rule, and the path that does not follow it
- [3-design.md](3-design.md) - the guard that drops the event, the four signatures that widen, and the two mutators that collapse
- [4-decisions.md](4-decisions.md) - one resolved decision and three assumptions, nothing open
- [5-tests.md](5-tests.md) - four checks, and what a header that will not clear means
- [6-tasks.md](6-tasks.md) - two commits: widen the types, then stop dropping the event

One rule, already written down in
[29-following-the-note-across-a-restore](../../3-archived/29-following-the-note-across-a-restore/1-index.md):
a session is bound to the open markdown note, or to null when nothing markdown
is open.

That spec applied the rule to the two entry points that build a session. The
third path moves a session already running, and it implements only the first
half:

```ts
if (file?.extension === 'md') void this.activeEngine?.followActiveNote(file.path)
```

A file-open carrying null, a canvas or a PDF fails the test and nothing happens,
which leaves the session on the note it had. The comment above those lines
argues for not binding to a canvas, which is right; what it does instead is stay
bound to the last note, which is a different thing.

Unbound is a state the rest of the engine already has. NoNoteBound,
NoNoteBoundMessage and SessionRepository.isBound all exist, and the panel header
already renders a null note name. Only this path cannot produce it, and four
signatures on the way to the panel type the path as string rather than string or
null.

Switching between two tabs that each hold a note does move the session, so the
subscription and the retarget path both work. Only the empty tab is dropped,
which puts the change in retargetActiveEngine rather than in a new subscription.

Recording that a retarget happened is a sibling spec,
[recording-a-retarget](../32-recording-a-retarget/1-index.md). This
one is about when it happens.
