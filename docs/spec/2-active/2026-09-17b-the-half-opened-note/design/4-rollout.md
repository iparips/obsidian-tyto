---
created: 2026-09-17
updated: 2026-09-17
---

# Out of Scope, Rollout and Sites

## Out of Scope

- Widening OpenedNoteWait. The wait settles too early, but D1 guards the use
  rather than the capture, and a handle that goes stale later needs the guard
  anyway.
- Telling an empty note from an unloaded editor. No signal separates them, and
  both reach the right content through the vault.
- Caching the vault read across a turn step. A cache would have to be
  invalidated by the writes the turn itself makes, which is the bug in another
  form.

## Rollout

1. Land the writer change with its tests, and the panel wording with D2's.
2. Run the probe in [3-requirements.md](../3-requirements.md) on mobile, and
   record what it shows in the spec whether or not it reproduces.
3. Run [5-acceptance-criteria.md](../5-acceptance-criteria.md) against a real
   vault and key, mobile included.
4. Move the spec to 3-archived.

## Sites This Design Touches

At today's lines.

- src/engine/note-editing/target-note-writer.ts:56 - tabStillShows, becoming editorHoldsTheNote
- src/engine/note-editing/target-note-writer.ts:29 - write, awaiting the new predicate
- src/engine/note-editing/target-note-writer.ts:47 - read, awaiting it and sharing readFile
- src/engine/note-editing/target-note-writer.ts:35 - focusEdit, keeping the identity test
- src/session/views/EntryProgress.tsx:37 - the panel wording that names a cause (D2)

## Sites It Reads But Leaves Alone

- src/commands/opened-note-wait.ts - hasEditor, the gap the handle is captured in
- src/engine/tools/note-edit-tool.ts:67 - the read-before-rewrite check, which inherits the fix
- src/engine/turn/model-service.ts:64 - the note context the model is shown
- src/session/transcript/transcript-entry-lines.ts:41 - the transcript line, which names no cause already

## Related Specs

Sister: [naming-what-a-turn-touched](../../../3-archived/2026-09-17c-naming-what-a-turn-touched/1-index.md),
whose edit line this reuses. Upstream:
[reaching-a-note-by-path](../../../3-archived/2026-09-16b-reaching-a-note-by-path/1-index.md),
whose vault fallback this reuses.
