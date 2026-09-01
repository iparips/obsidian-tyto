# Cross-File Skills: Component Design

Delta on the Desktop MVP design. Unlisted components are unchanged.

Discovery, frontmatter parsing and prompt injection are already built. This
document covers what the MVPs defer: skill bodies, file tools, and undo.

## Source tree

```
src/skills/
  skill-body.ts        # read one skill's body on request
src/engine/
  vault-writer.ts      # writes to files other than the session note
  turn-journal.ts      # records a turn's writes for undo
```

SkillLoader, skill-frontmatter and skill-catalogue (Skills) are unchanged.

## Skill bodies

A `load_skill` tool added to TOOL_SCHEMAS (Engine) fits the existing loop. The
model already calls tools, EditEngine.executeCall() (Engine) already pushes
results into history, and a body returns the same way any tool result does. It
also puts the choice with the model, which has the utterance (FR1, FR2).

The catalogue tracks which bodies a turn has loaded, so a second request for
the same skill returns the first result rather than re-reading (FR3).
MAX_ITERATIONS (Engine) still bounds the turn (NFR2).

## File tools

Three tools, each taking a vault-relative path:

- `read_note` returns a named note's content for the model to reason over (FR4).
- `create_note` writes a new note, creating parent folders (FR5).
- `edit_note` applies the existing anchor-based operations to a named note (FR6).

Path handling is the security surface. Normalise every path, reject absolute
paths, reject any path escaping the vault root after normalisation, and reject
a path outside the vault regardless of which skill asked (NFR4).

`edit_note` reuses EditApplier (Engine) rather than a second implementation, so
anchor semantics stay identical wherever an edit lands.

## Undo

Resolve this before building the file tools. It is the open question
[1-requirements.md](1-requirements.md) raises, and it constrains everything above.

The problem: `app.vault.modify` writes outside the editor's undo stack. A turn
that edits the session note through the editor and another note through the
vault API leaves the user with a change that undoes halfway (NFR1).

Three options to weigh:

| Option              | How it works                                                    | Cost                                                    |
|---------------------|-----------------------------------------------------------------|---------------------------------------------------------|
| Route through editors | Open each target in a hidden editor, apply through the editor API | Undo works natively; opening files has UI side effects  |
| Staged transaction  | Buffer every write, apply on turn success, discard on failure    | Atomic per turn; still outside the editor's undo stack  |
| Turn journal        | Record prior content per file, expose a plugin-level undo        | Works everywhere; a second undo gesture users must learn |

Pick one, state why, and note what the user has to press to undo a turn.

## Unsupported-skill message

FR37 of the MVP declines every cross-file skill. Once the file tools land, that
message narrows to what is still out of reach: script execution, file deletion,
and anything a skill asks for beyond the tool list (FR7).

Update the skills section of the system prompt in the same change, so the rule
the model applies matches the tools it holds.

## Turn summary

A turn touching several files reports each one, so the user can see what landed
without opening them (FR8). The existing summary renders in SessionPanel (UI);
this extends it with a per-file line rather than adding a new surface.

## Trust boundary

Unchanged from the MVP, and load-bearing now that writes are broader. A skill
body is user content reaching the model as instructions. Tools come from
TOOL_SCHEMAS (Engine), so a skill naming something outside them finds no tool
(NFR3).

The new rule is the path check: a skill that names a path is subject to the
same normalisation and vault-root check as any other input. Never let a skill
file name a tool, an API endpoint, or a path the plugin then acts on unchecked.

## Testing

Follow the repo's existing conventions in `src/test-support/`. Cover:

- A skill body loads when the model requests it.
- A body requested twice in a turn reads once.
- A note is created at a computed path, parents included.
- An anchor edit applies to a note other than the session note.
- A path escaping the vault root is refused.
- An absolute path is refused.
- A failed write mid-turn leaves the vault in the state the undo decision specifies.
- The turn summary names every file touched.
