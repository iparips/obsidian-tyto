# Settings Command Picker: Implementation Order

## Status

Not started. The harness MVP is built and its suite passes; this is a delta on
that codebase, touching the settings surface and one command package split.

Verify before starting: `bun run build` passes.

## Steps

Each step leaves the suite green.

1. `src/commands/command-registry.ts`: move the module augmentation, the probe
   and the availability check out of CommandCatalogue (Commands), which keeps
   only its filtering and stops importing Obsidian.

   Behaviour-preserving, but not confined to one file. CommandCatalogue
   (Commands) takes a registry in place of its App. CommandRunner (Commands)
   keeps its App, because it reads `app.workspace` for the active file, and
   gains the registry for `executeCommandById`.

   Four construction sites follow: EngineFactory (Engine), OwlSettingsTab
   (Settings) and two in builders.ts (Test Support). FakeCommandRegistry (Test
   Support) exposes only `asApp()`; it gains a way to serve as a CommandRegistry
   so the catalogue and search tests can construct one.

   The catalogue's and runner's existing tests must pass with no change beyond
   construction. A test needing its assertions edited means behaviour moved,
   which this step must not do.

2. `src/commands/allow-list.ts`: add `coveringEntry`, returning which entry
   permits an id rather than whether one does. `permits` stays, expressed
   through it.

3. `src/commands/models/command-match.ts`: the value pairing a command with the
   entry covering it, plus the plugin-id split and the positional-id check.

4. `src/commands/command-search.ts`: name matching, the cap of 20, the overflow
   flag, and the empty-query rule. No Obsidian dependency beyond the registry,
   so it tests against the existing fake.

5. `src/settings/CommandMatchRow.tsx`: one result row, its id, and its add
   control or covered marker.

6. `src/settings/CommandPicker.tsx`: the query field, the results, the overflow
   line, and the pattern suggestion.

7. `src/commands/models/entry-reach.ts` and
   `src/commands/entry-reach-resolver.ts`: what each stored entry reaches, and
   the "reaches nothing" case.

8. `src/settings/AllowedEntryRow.tsx`: one entry, editable in place, beside what
   it reaches. Carries the draft state that keeps a half-typed entry from being
   discarded, as the textarea does today.

9. `src/settings/AllowedEntries.tsx`: the table, and removal.

10. `src/settings/AllowListEditor.tsx`: compose the picker above the table. The
    bulk textarea goes, along with its tests; the cases it covered move to the
    row and the table.

    ResolvedCommands (Settings) goes with it. The collapsed count it renders is
    what the table now shows per entry, so the `resolvedCommands` prop threaded
    through OwlSettingsTab (Settings) and SettingsPanel (Settings) is removed
    rather than left feeding a component nothing renders.

## Exit test

By hand in a real vault, since the registry is what the suite fakes.

1. Search a name from the palette, add it, and confirm the stored entry is the
   id. The reference case is a positional plugin: search "shopping", add it, and
   check the warning names the reordering risk.
2. Add a second command from the same plugin, accept the pattern, and confirm
   the two ids collapse to one entry covering both.
3. Turn every command plugin off, open settings, and confirm the picker is empty,
   every entry reads "reaches nothing", and rows are still editable.

4. Type a wildcard over an id the picker added, and confirm the row validates as
   you type and the count updates when it becomes valid.

## What to decide while building

Nothing outstanding. The pattern suggestion is settled in
[3-component-design.md](3-component-design.md): adding always stores the exact
id, and the suggestion appears beside the entry it would replace, ignorable
without dismissing.
