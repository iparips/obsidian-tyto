# Obsidian Agent Harness: Implementation Order

## Status

Built. Every step below is implemented and `bun run build` passes, which runs the
suite, the linter and the bundler. The exit test still needs a run by hand in a
real vault.

Eight files the design did not name were added while building. Most exist to
keep EditEngine (Engine) on the loop alone; the rest split state by how long it
lives.

- ToolDispatcher (Engine, new) holds what one tool call does to the note, the
  session and the panel.
- SessionRepository (Session, new) owns the target note and the conversation, so
  no tool moves the target by writing a field it happens to touch. It replaces
  AgentSession (Engine), whose operation history nothing read.
- TargetNoteResolver (Engine, new) turns the target path into the editor showing
  it and that folder's AGENTS.md chain.
- TurnProgressPublisher (Engine, new) carries what a turn publishes as it runs,
  so a command entry lands before the edit that follows it.
- TurnRepository (Engine, new) holds what one turn holds and a command may move:
  the note in hand, its chain, the last edit position and the per-turn caps. It
  is built per turn and discarded with it, because an editor handle cannot
  outlive the turn the way a path can.
- TurnFactory (Engine, new) opens a turn: it holds what outlives one and builds
  what does not, so nothing turn-scoped is reachable outside a turn and every
  collaborator arrives through a constructor.
- ResolvedNote (Engine, new) pairs the target note with the chain governing it,
  so the two never arrive from different folders.
- EngineFactory (Engine, new) assembles one session's engine, so main.ts stays
  a lifecycle file rather than a wiring one.

Two renames went with them. NoteContext (Engine) became NoteDetails, and
PromptBuilder (Engine) now returns messages rather than text, so the engine names
the parts of a model call without assembling them.

## Steps

Each step is small enough to review alone, and leaves the suite green. Steps 1
to 3 are independent and can proceed in parallel; the rest are sequential.

1. `src/settings/settings.ts`: rename `VoiceEditSettings` to `OwlSettings`, and
   add `commandAllowList` and `searchEnabled` per
   [08-data-model.md](08-data-model.md). Rename `VoiceEditPlugin` in main.ts and
   `VoiceEditSettingsTab` in settings-tab.ts to match. Missed by the rename to
   Owl, so it is cleanup rather than new work.

2. `src/search/models/search-hit.ts` and `src/search/vault-search.ts`: the scan
   over `getMarkdownFiles` and `cachedRead`, scored with `prepareSimpleSearch`,
   with the result cap, the excerpt trim and the recency filter. Tests per
   [09-testing-strategy.md](09-testing-strategy.md). No private API here, so this
   step carries no risk and is the one to start with.

3. `src/search/note-reader.ts`: read one note by path, returning an Outcome.

4. `src/commands/allow-list.ts`: entries, the colon rule, and validation. Pure
   string logic with no Obsidian dependency, so it tests without a fake.

5. `src/commands/models/allowed-command.ts` and `command-effect.ts`: the two
   value objects.

6. `src/test-support/fake-command-registry.ts` and `fake-workspace.ts`: the two
   doubles [09-testing-strategy.md](09-testing-strategy.md) needs.

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
    [04-decisions.md](04-decisions.md) before designing this one; it is the least
    specified part of the release.

15. `src/main.ts`: build the engine per session. The wiring landed in
    EngineFactory (Engine, new) rather than here, so main.ts stays a lifecycle
    file. Every collaborator is still explicit, per the constructor convention.

## Exit test

Three scenarios from [2-plan.md](../../2-plan.md), run by hand in a real vault.
Everything else is covered by the suite; these are what the suite cannot reach.

Before starting, check settings holds an allow-list your vault can act on. The
default is `daily-notes:*`, which needs the core Daily Notes plugin enabled. The
resolved count under the box says how many commands the list currently reaches:
zero means no command tool is offered at all.

1. Command and edit. Say "open my daily note and add a paragraph under
   Meetings". The daily note opens, the panel header names it, a command entry
   appears before the edit, and the paragraph lands under that heading. Press
   Cmd-Z: the edit undoes through native history (NFR5).
2. Search and answer. Say "what did I write about the roofing quote recently".
   The panel shows a copyable summary with its source paths listed apart from
   the body, and no note changes. Check the sources name notes that exist.
3. Release 3 regression. Empty the allow-list, turn search off, and run an
   ordinary edit. It behaves as it did before this release. The stored prompt
   fixture covers this mechanically; the manual pass is for the tool inventory
   and the panel.

What to watch for, since each is a case the suite fakes rather than exercises:

- A command that opens a note in a way Obsidian does not surface as a markdown
  leaf. The panel should say no note opened, and the next edit should land on
  the original note rather than failing.
- A search over a large vault. Cost is bounded by construction (NFR6), but the
  first run is the only check that `cachedRead` behaves as assumed at scale.
- The settings surface on a phone, per FR8.

## Decisions taken while building

The four open questions in [04-decisions.md](04-decisions.md) are settled there,
under "Settled while building": command effect verification, the answer entry's
shape, the mobile settings surface, and whether to carry a denylist of
destructive core ids.
