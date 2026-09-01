# Repo Skills: Component Design

Delta on the Desktop MVP design. Unlisted components are unchanged.

## Source tree

```
src/skills/
  skill-loader.ts      # adapter access, enumerate and read SKILL.md files
  skill-frontmatter.ts # parse name and description out of a skill file
  skill-catalogue.ts   # holds discovered skills for a session
```

`SkillLoader` (Skills) takes the Obsidian adapter, not `App`, so tests inject a
fake without touching the workspace.

## Discovery

`app.vault.getFiles()` omits dot-directories, so discovery goes through
`app.vault.adapter`:

- `adapter.list('.agents/skills')` returns the skill folders.
- `adapter.read()` on each `SKILL.md`.

A missing directory throws rather than returning empty. Catch it and produce an
empty catalogue, per FR7.

Mobile check comes first. Obsidian's mobile adapter has been inconsistent with
hidden directories. Confirm `adapter.list('.agents/skills')` resolves on a real
device before building on it. If it does not, stop: the vault's skill location
is the user's decision, not this task's.

## Frontmatter parsing

Skill frontmatter is a leading `---` block with `name` and `description`. The
description is usually a YAML folded scalar spanning several lines:

```yaml
---
name: todo
description: >
  Manage todo.md files in the Obsidian weekly notes vault. Archives ticked
  items into an Archived section at the bottom of the file.
---
```

Handle the folded form. A regex over the block is enough for these two keys,
and avoids a YAML dependency for a shape this narrow. State the limitation in
code: anything more structured needs a real parser.

A file with no frontmatter, or no `name`, is skipped per FR8.

## Prompt injection

`PromptBuilder.build()` (Engine) gains a section listing available skills, one
line each:

```
todo - Manage todo.md files ... archives ticked items to the bottom.
journal - Place, update, or find a dated journal entry ...
```

Omit the section entirely when the catalogue is empty, so a vault without
skills produces today's prompt byte for byte.

## Phase-two trigger

Open decision. Resolve it in this document before implementing.

A `load_skill` tool added to `TOOL_SCHEMAS` (Engine, new) fits the existing
loop: the model already calls tools, `EditEngine.executeCall()` already pushes
results into history, and a skill body would return the same way a tool result
does. It also puts the choice with the model, which has the utterance.

Weigh it against the alternatives before committing. Whatever is chosen,
`MAX_ITERATIONS` still bounds the turn, and each body loads at most once per
turn per FR6.

## Trust boundary

A skill body is user content that reaches the model as instructions. It cannot
widen capability: tools come from `TOOL_SCHEMAS`, and a skill asking for
something outside them simply fails to find a tool.

Keep it that way. Do not let a skill file name a tool, an API endpoint, or a
path outside the vault that the plugin then acts on.

## Testing

Follow the repo's existing conventions. Cover:

- Catalogue built from a directory holding several skills.
- Missing `.agents/skills` yields an empty catalogue and today's prompt.
- Malformed skill skipped, valid siblings still loaded.
- Folded-scalar description parsed across lines.
- Phase-two load places the body where the model sees it.
- A body loads once when requested twice in a turn.

Use the fake-editor and builder helpers in `src/test-support/`.
