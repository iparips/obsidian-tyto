# Settings Command Picker: Implementation Order

## Status

Built, and revised after using it in a real vault. `bun run build` passes; the
exit test below is by hand and has not been run.

What the build settled that the design did not:

- SearchResults (Commands, new) sits in models/ rather than beside CommandSearch
  (Commands), following the repo's rule that value objects live in models/.
- The pattern suggestion and its positional warning are gone, and with them the
  per-entry reach resolver the design named. What the entries reach is resolved
  once for the whole list, through the catalogue that already answers it.
- The allow-list rule changed: a colon is required of a pattern, not of every
  entry. Obsidian's core plugins register unnamespaced ids, so daily-notes is a
  whole command id and the old rule refused the picker's own output.

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

5. `src/settings/CommandMatchRow.tsx`: one result row, its id, and the covered
   marker. The row itself is the control, so there is no separate add button.

6. `src/settings/CommandPicker.tsx`: the query field, the results and the
   overflow line. Choosing a row clears the query, so the results close.

7. `src/settings/ResolvedCommands.tsx`: the collapsed section naming every
   command the allow-list reaches. CommandCatalogue (Commands) already answers
   that, so no per-entry resolver is built.

8. `src/settings/AllowedEntryRow.tsx`: one entry, editable in place, with its
   remove control. Carries the draft state that keeps a half-typed entry from
   being discarded, as the textarea does today.

9. `src/settings/AllowedEntries.tsx`: the list, and removal.

10. `src/settings/AllowListEditor.tsx`: compose the picker above the list, and
    the resolved section below it. The bulk textarea goes, along with its tests;
    the cases it covered move to the row and the list.

    ResolvedCommands (Settings) stays, rewritten: it resolves the whole
    allow-list rather than collapsing a count, so the `resolvedCommands` prop
    threaded through OwlSettingsTab (Settings) and SettingsPanel (Settings)
    stays with it.

## Exit test

By hand in a real vault, since the registry is what the suite fakes.

1. Search a name from the palette, choose it, and confirm the stored entry is
   the id and the results close. The reference case is a positional plugin:
   search "shopping" and check the entry reads open-or-create-file-command with
   an index.
2. Type a wildcard over an id the picker added, and confirm the row validates as
   you type and the resolved count updates when it becomes valid.
3. Allow a core command such as daily-notes, whose id carries no colon, and
   confirm it is accepted and resolves to its palette name.
4. Turn every command plugin off, open settings, and confirm the picker is
   empty, the resolved section reads zero, and rows are still editable.

## What to decide while building

Nothing outstanding. The wildcard question is settled in
[3-component-design.md](3-component-design.md): choosing a command stores its
exact id, nothing is suggested, and a user wanting a pattern types it over an
entry.
