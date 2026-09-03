# Choosing the Note: Implementation Order

## Status

Not started. Depends on the session-scoped SeenPaths and the split open budget,
both already landed alongside
[10-finding-notes](../10-finding-notes/1-index.md).

Verify before starting: `bun run build` passes.

## Two commits

The work splits where the user-facing change does, and each half stands alone.

| Commit | Steps | Delivers                                    | Exit test        |
| ------ | ----- | ------------------------------------------- | ---------------- |
| First  | 1-6   | Choosing a note, and retiring the confirm    | Picking a note   |
| Second | 7-10  | The decline, and what it steers the model to | Declining a list |

The first commit ships a working feature and removes the old one in the same
breath: the model offers, the user picks, and the confirmation is gone. Leaving
both would give the model two ways to ask about one note, which is the confusion
this spec removes.

## Steps, first commit

Each step leaves the suite green.

1. `src/engine/models/chosen-notes.ts`: the turn-scoped set, and its place
   beside TurnBudget in TurnRepository.

   Nothing calls it yet. Get the scope right here: it is built by
   TurnRepository, never passed in by TurnFactory, which is what makes it die
   with the turn.

2. `src/engine/note-choice.ts`: the parked pick over PendingAnswer, its
   automatic mode, and holds.

   choose returns a path or null. A boolean here is the old design leaking back
   in, and the null is what the second commit builds the decline on.

3. `src/engine/models/tool-schemas.ts` and
   `src/providers/models/tool-call.ts`: choose_note, its schema, its predicate
   and its entry in isHarnessTool.

   The predicate or ToolDispatcher routes the call to the note editor and it
   fails as an unknown edit.

4. `src/engine/harness-tools.ts`: the call, the SeenPaths filter, and the step.

   The filter runs before the user sees the list. A shortlist that reaches the
   panel unchecked lets a fabricated path be approved, which is the guard in
   step 5 routed around.

5. `src/engine/tool-dispatcher.ts`: the choice, the recording, and open_note's
   new refusal.

   Both refusals stay, and they say different things. A path no search returned
   names the search; a path not chosen names choose_note.

6. Remove OpenApproval, its panel entry and its action, per the table in
   [3-component-design.md](3-component-design.md#what-replaces-openapproval).

   `open-approval.ts`, its test, the confirm entry kind, openRequested and
   openAnswered, and the settling in AskedEntries. The approval repository added
   for the session scope goes with it.

## Steps, second commit

7. `src/engine/note-choice.ts` and `src/engine/tool-dispatcher.ts`: the decline
   path, and the result that names the next move.

   The result is the whole of this step. A model told only "declined" searches
   again, which is the loop the spec exists to remove.

8. `src/session/models/panel-state.ts` and the views: the declined entry, and
   the list that renders on a narrow drawer.

   Paths wrap rather than truncate. A middle ellipsis hides the segment that
   distinguishes two candidates, which is the one the user is reading.

9. `src/engine/rule-builder.ts`: choosing in the reach order, the
   one-candidate rule, and the decline rule.

   A prompt change is a behaviour change: verify the rest is byte-for-byte
   unchanged, against git rather than by eye. The release 3 fixture must still
   match exactly.

10. `docs/spec/9-model-chosen-targets/`: mark the confirmation superseded.

    That spec describes a yes/no confirmation that no longer exists. Leaving it
    describing a retired mechanism is how a spec folder stops being trusted.

## Exit test, picking a note

By hand in a real vault, on both surfaces.

1. Ask for a note by a description matching several. Confirm the model offers
   them and the panel lists every path.
2. Pick one. Confirm that note opens and the edit lands in it.
3. Confirm the panel names the note you picked once the choice settles.
4. Ask for a note matching exactly one. Confirm you are still asked.
5. Ask for an edit, then a second edit in the same turn. Confirm you are asked
   once.
6. Start a new turn naming the same note. Confirm you are asked again.
7. Ask for a note found in an earlier turn. Confirm no re-search is needed.
8. Turn on auto mode. Confirm nothing asks and the model opens what it found.
9. On mobile, run step 1 in the drawer. Confirm the paths are readable and the
   turn completes.

## Exit test, declining a list

By hand in a real vault, on both surfaces.

1. Offer a shortlist and decline every candidate. Confirm nothing opens and no
   note changes.
2. Confirm the model asks what you meant rather than searching again.
3. Answer that question. Confirm the model offers a new shortlist and the turn
   completes.
4. Decline, then decline again. Confirm the turn still has its open to spend.
5. Confirm the panel records the declined shortlist rather than dropping it.
6. Cancel a turn while the list is on screen. Confirm the turn settles and
   nothing opens.
7. With the panel closed, run step 1. Confirm the notice says the turn wants you.

## What to decide while building

- Whether the shortlist needs a cap, and what a model offering thirty notes is
  told. A glob returns fifty, and a picker of fifty is not a choice.
- Whether purpose should be shown per candidate or once above the list, when
  the model offers notes for different reasons.
- Whether a declined shortlist should be re-offerable, or whether the same list
  twice should refuse.
