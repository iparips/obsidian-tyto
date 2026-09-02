# Obsidian Agent Harness: Implementation Order

## Status

Not started. Releases 1 to 3 are built and their tests pass; this is a delta on
that codebase. Read [4-component-design.md](4-component-design.md) first, then
[7-data-model.md](7-data-model.md) for the types every step below refers to.

Verify before starting: `bun run test` passes, and `bun run build` produces
main.js.

## Steps

Each step is small enough to review alone, and leaves the suite green. Steps 1
to 3 are independent and can proceed in parallel; the rest are sequential.

1. `src/settings/settings.ts`: rename `VoiceEditSettings` to `OwlSettings`, and
   add `commandAllowList` and `searchEnabled` per
   [7-data-model.md](7-data-model.md). Rename `VoiceEditPlugin` in main.ts and
   `VoiceEditSettingsTab` in settings-tab.ts to match. Missed by the rename to
   Owl, so it is cleanup rather than new work.

2. `src/search/models/search-hit.ts` and `src/search/vault-search.ts`: the scan
   over `getMarkdownFiles` and `cachedRead`, scored with `prepareSimpleSearch`,
   with the result cap, the excerpt trim and the recency filter. Tests per
   [8-testing-strategy.md](8-testing-strategy.md). No private API here, so this
   step carries no risk and is the one to start with.

3. `src/search/note-reader.ts`: read one note by path, returning an Outcome.

4. `src/commands/allow-list.ts`: entries, the colon rule, and validation. Pure
   string logic with no Obsidian dependency, so it tests without a fake.

5. `src/commands/models/allowed-command.ts` and `command-effect.ts`: the two
   value objects.

6. `src/test-support/fake-command-registry.ts` and `fake-workspace.ts`: the two
   doubles [8-testing-strategy.md](8-testing-strategy.md) needs.

7. `src/commands/command-catalogue.ts`: the module augmentation declaring
   `app.commands`, the probe that yields an empty catalogue when the methods are
   absent, and resolution against the live list. The augmentation is declared
   here and nowhere else.

8. `src/commands/command-runner.ts`: the before-and-after diff around
   `executeCommandById`, refusing ids outside the catalogue.

9. `src/engine/models/tool-schemas.ts`: the four new schemas, and the matching
   predicates on `ToolCall` beside `isLoadSkill`.

10. `src/engine/prompt-builder.ts`: the command section, built like the skill
    section and omitted when the catalogue is empty. Add the FR11 decline
    instruction to `rule-builder.ts`.

11. `src/engine/edit-engine.ts`: dispatch for the four tools, the rebind on a
    command effect, AGENTS.md re-resolution after a rebind, and the cap raised
    from 6 to 10. The largest step; split it if the diff grows past review size.

12. `src/session/models/panel-state.ts`: the `command` and `answer` entry kinds
    and their actions.

13. `src/session/views/HistoryEntry.tsx` and `styles.css`: rendering for both
    new kinds, sources shown apart from the copyable body.

14. `src/settings/SettingsPanel.tsx`: the allow-list editor and the resolved
    command list, collapsed by default per FR8. Read the mobile open question in
    [3-decisions.md](3-decisions.md) before designing this one; it is the least
    specified part of the release.

15. `src/main.ts`: construct the catalogue, runner, search and reader, and pass
    them into EditEngine. Every collaborator is explicit, per the constructor
    convention.

## Exit test

From [2-plan.md](../2-plan.md): "open my daily note and add a paragraph under
Meetings" opens the note and edits it; "what did I write about the roofing quote
recently" returns a copyable summary naming its sources and touches no note; and
a vault with an empty allow-list behaves byte for byte as release 3.

Run all three by hand in a real vault. The third is the regression check, and
the prompt-builder test in step 10 covers it mechanically.

## What to decide while building

Four questions in [3-decisions.md](3-decisions.md) shape the build rather than
gate it. Steps 8, 13 and 14 are where they land: command effect verification,
the answer entry's shape, and the mobile settings surface. Record what you chose
in that file as you go, rather than leaving the questions open behind you.
