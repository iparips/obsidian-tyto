# Finding Notes: Implementation Order

## Status

Not started. Depends on nothing else in this release.

Touches the same tool set as
[9-model-chosen-targets](../9-model-chosen-targets/1-index.md), whose open_note
takes its paths from SeenPaths (Search). Both new tools must record there, or a
note the model can find is a note it cannot open.

Verify before starting: `bun run build` passes.

## Two commits

The work splits where the tools do, and each half stands on its own.

| Commit | Steps | Delivers                                   | Exit test      |
| ------ | ----- | ------------------------------------------ | -------------- |
| First  | 1-7   | Listing notes by path, and retiring search | Finding a note |
| Second | 8-12  | Finding notes by content                   | Reading a note |

The first commit ships a working feature and removes the old one in the same
breath: the model globs for a note, opens it and edits it, and search_vault is
gone. Retiring it in the first commit rather than the second is deliberate, since
leaving both would let the model keep choosing the tool this design replaces.

## Steps, first commit

Each step leaves the suite green.

1. `src/search/models/path-pattern.ts`: the compiled matcher, its three
   wildcards, its escaping and its anchoring.

   Nothing calls it yet, so this step is the matching rules with no tool
   attached. Get `**/` matching zero segments right here: it is the rule a later
   test will otherwise blame on the glob.

2. `src/search/models/result-order.ts`: the sort field, the direction, and the
   per-field default direction.

   Also unused at this point. Both searchers take it, so it lands before either.

3. `src/search/note-glob.ts` and `src/search/models/glob-result.ts`: the pass
   over getMarkdownFiles, the cap of 50, and the trimmed flag.

   Assert it calls no cachedRead. FakeVault records every read, so NFR2 is one
   assertion rather than a convention.

4. `src/engine/models/turn-budget.ts`: a glob counter and a grep counter beside
   the four, each with its own cap message and its own entry in spentTools.

   The grep counter lands here rather than in the second commit, so the budget
   is one change rather than two.

5. `src/engine/harness-tools.ts`, `src/engine/models/tool-schemas.ts`,
   `src/providers/models/tool-call.ts`, `src/search/models/seen-paths.ts` and
   `src/engine/models/turn-step.ts`: glob_notes, its schema, its predicate, its
   step and its recording.

   SeenPaths gains recordPaths, or open_note refuses everything the glob found.
   tool-call.ts gains the predicate and isHarnessTool, or ToolDispatcher routes
   the call to the note editor and it fails as an unknown edit.

6. Remove search_vault and delete VaultSearch, per the table in
   [3-component-design.md](3-component-design.md#retiring-search_vault).

   Five production files and five test files, and the two that matter are
   `edit-engine-model-chosen.test.ts` and `harness-tools-open.test.ts`: their
   helpers put a path in SeenPaths so open_note will accept it, and each becomes
   a glob rather than being deleted. Deleting them loses the coverage that
   open_note refuses an unseen path.

   The path-scoring branch VaultSearch grew is what PathPattern now does exactly,
   so nothing is lost that step 1 did not replace.

7. `src/engine/rule-builder.ts`: the order to try, replacing the search rules.

   A prompt change is a behaviour change: verify the rest of the prompt is
   byte-for-byte unchanged, against git rather than by eye. The release 3
   fixture must still match exactly.

## Steps, second commit

8. `src/search/note-grep.ts` and `src/search/models/grep-result.ts`: the
   expression, the optional path filter, the excerpt, the match count, and the
   cap of 10 with excerpts or 50 without.

   The path filter runs before the read. A grep narrowed to a folder that reads
   every note in the vault passes its tests and fails NFR1.

9. `src/search/models/grep-request.ts`: the value HarnessTools builds from the
   tool call, and its admits.

   Worth its own file rather than four arguments, since both narrowings and
   paths_only are optional and a positional list would read wrongly.

   Get the empty paths list right here: it means no filter, not no notes. Read
   literally it makes every grep that sends one report the text as absent.

10. `src/engine/harness-tools.ts` and `src/engine/models/tool-schemas.ts`:
    grep_notes, its schema, its arguments and its step.

    matches is a sort value here and nowhere else. ResultOrder sorts by the key
    it is handed; only grep hands it a count.

11. `src/engine/rule-builder.ts`: the grep line in the order, and the rule about
    globbing before guessing.

    Byte-for-byte against git again, as in step 7.

12. `docs/spec/4-harness-mvp/07-search-and-answering.md`
    and `03-functional-requirements.md`: mark the search flow superseded.

    The MVP spec describes search_vault as the search mechanism. Leaving it
    describing a tool that no longer exists is how a spec folder stops being
    trusted.

## Exit test, finding a note

By hand in a real vault, on both surfaces.

1. With a vault organised by date, say "find the note for last Friday and add a
   line at the top". Confirm the model globs the week folder rather than
   guessing a filename.
2. Confirm the panel's steps list names the glob and how many notes it matched.
3. Confirm the note it opens is the right one, and the edit lands.
4. Glob a folder that does not exist. Confirm the model is told nothing matched
   and says so, rather than retrying.
5. Ask for the most recent note in a folder. Confirm the newest comes back, not
   the alphabetically last.
6. Spend the glob budget. Confirm glob_notes stops being offered rather than
   refusing three times.
7. Disable search. Confirm neither tool is offered and the model says it cannot
   reach the destination.
8. On mobile, run step 1 in the drawer. Confirm the steps list is readable and
   the turn completes.

## Exit test, reading a note

By hand in a real vault, on both surfaces.

1. Ask what you wrote about a term appearing in several notes. Confirm the model
   greps and names the notes.
2. Confirm the excerpt around each match is enough to tell a real hit from an
   incidental one.
3. Ask the same narrowed to one folder. Confirm the answer covers only that
   folder.
4. Ask a question whose answer is which note holds something. Confirm the model
   asks for paths alone rather than pulling excerpts it does not need.
5. Grep for a term in no note. Confirm the model says so rather than answering
   from its own knowledge.
6. Ask a question about the vault. Confirm answer_from_search still works,
   drawing on what the grep returned.
7. With the panel closed, run step 1. Confirm the finished notice arrives.

## What to decide while building

- Whether grep's excerpt should be lines either side of the match rather than
  NoteExcerpt's fixed character width. Prose reads better by line; the fixed
  width is already built and bounded.
- Whether a grep with paths_only should skip the excerpt work entirely or
  compute and discard it. Skipping is faster and splits the code path.
- What a grep does with a note matching hundreds of times. The count is wanted
  for sorting, but every offset is not.
