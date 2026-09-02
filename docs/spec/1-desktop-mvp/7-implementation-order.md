# Desktop MVP: Implementation Order

## Status

The release is built and its tests pass. `src/` holds the plugin lifecycle,
session binding and rebind flow, the recorder, the Mistral provider, the tool
schemas and prompt builder, the edit engine loop, the anchor applier, and the
React session and settings panels.

Vault skills (FR34-38) are the one part not built. Everything below is that
delta. Treat the rest of this folder as a description of working code, not a
build sequence.

## Steps

Each step is small enough to review alone. Steps 1 and 2 can proceed in
parallel; the rest are sequential.

1. `src/skills/skill-frontmatter.ts`: parse name and description out of a
   SKILL.md, handling the folded-scalar description. Tests cover the folded
   form, a missing frontmatter block, and a block with no name.
2. `src/settings/settings.ts`: add `skillsPath` to the interface and the
   defaults, per [3-data-model.md](3-data-model.md).
3. `src/skills/skill.ts` and `src/skills/skill-repository.ts`: the Skill
   type, the catalogue, and adapter-driven discovery with the signature in
   [4-component-design.md](4-component-design.md). Tests drive a fake adapter
   and cover a populated folder, a missing folder, an empty configured path,
   and a malformed file among valid siblings.
4. `src/engine/tool-schemas.ts`: `PromptBuilder.build()` takes a catalogue
   defaulting to empty, and emits the skills section and scope rule when it has
   entries. Tests assert the section is present with entries, absent without,
   and that the scope rule is carried.
5. `src/main.ts` and `src/engine/edit-engine.ts`: build the catalogue in
   `buildPanelProps()` and pass it through the EditEngine constructor to the
   prompt, per the Wiring section of [4-component-design.md](4-component-design.md).
6. `src/settings/SettingsPanel.tsx`: the skills folder field, per
   [5-settings-ui.md](5-settings-ui.md).
7. Manual exit test against a vault holding real skills.

## Exit test

Run against a vault whose skills folder holds both kinds of skill.

- An instruction matching a single-note skill follows that skill's workflow
  rather than improvising (FR36).
- An instruction matching a cross-file skill is declined by name, with no
  partial edit made (FR37).
- A vault with `skillsPath` pointing nowhere behaves exactly as the current
  build does (FR38).

This step needs a real API key.
