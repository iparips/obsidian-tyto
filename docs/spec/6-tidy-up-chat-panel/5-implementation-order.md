# Tidy Up Chat Panel: Implementation Order

## Status

Built. All six steps have landed and `bun run build` passes. The exit test below
is by hand in a real vault, and has not been run.

## Steps

Each step leaves the suite green.

1. `src/session/models/entry-weight.ts`: the weight type and the kind-to-weight
   mapping. Pure, so it tests without rendering anything.

2. `src/session/views/HistoryEntry.tsx`: carry the weight class beside the kind
   class, and keep the copy control on the replies alone.

   One existing case contradicts FR7 and goes: "copies the command text when
   copy is clicked", in `HistoryEntry.test.tsx`, asserts the control this step
   removes from a context line. The case beside it, asserting the command class,
   stays.

   The stylesheet still holds the old rules at this point, so the panel looks
   unchanged. That is intentional: the mapping lands and stays green before
   anything visual moves.

3. `styles.css`: the three treatments. The bubble, the plain reply, and the
   tight context line, plus the gap rule that stacks consecutive context lines.

   This is the step the exit test judges, and the only one a unit test cannot.
   Every colour comes from an Obsidian variable (NFR1).

4. `src/session/views/PendingEntry.tsx`: the pending line, and the phase it
   names.

5. `src/session/views/HistoryList.tsx`: render the pending line after the
   entries, and pass it the phase.

   HistoryList takes the phase as a prop, which SessionPanel already holds.

6. Remove the return-to-starting-note path. It runs four levels deep, and a
   step that stops at the panel leaves dead code behind it.

   - `src/session/views/SessionPanel.tsx`: the button and the
     `returnToStartingNote` prop.
   - `src/main.ts`: the prop it passes.
   - `src/engine/edit-engine.ts`: `returnToStartingNote`, which nothing else
     calls.
   - `src/session/session-repository.ts`: `resetTargetNoteToOriginal`, which
     exists only for it. [7-sessions-without-a-note](../7-sessions-without-a-note/1-index.md)
     removes the same method, so whichever spec lands second finds it gone.

   Seven test cases go with it, and one nearby case must not: "names the new
   target note in the header" covers FR13 and stays.

   - `src/session/views/tests/SessionPanel.test.tsx`: the three cases naming
     "Return to note".
   - `src/engine/tests/edit-engine-harness.test.ts`: the two cases calling
     `returnToStartingNote`.
   - `src/session/tests/session-repository.test.ts`: the two cases calling
     `resetTargetNoteToOriginal`.

## Exit test

By hand, in a real vault, on both surfaces. The stylesheet is what this feature
is, and no unit test judges it.

1. Run a turn that opens a note, so the panel holds an utterance, an
   instructions line, a command line and a reply. Confirm the reply is the
   easiest thing to find.
2. Watch a turn run from the start. Confirm the pending line names transcribing,
   then thinking, then is replaced by the reply.
3. Run a turn that fails. Confirm the pending line goes, and the error reads as
   a reply rather than a box.
4. Read a session on a phone, in the drawer. Confirm the bubble is legible at
   that width and the context lines have not wrapped into a wall.
5. Switch the vault to a light theme, and to a community theme. Confirm nothing
   is unreadable and no colour is hard-coded.
6. Select part of a reply and copy it. Confirm the control never covers the
   text, and that no other weight offers one.

## What to decide while building

Nothing outstanding. The weights are settled in
[2-requirements.md](2-requirements.md), and the pending line's placement in
[3-component-design.md](3-component-design.md).
