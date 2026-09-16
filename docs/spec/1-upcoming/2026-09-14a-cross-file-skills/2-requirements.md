# Requirements: Cross-File Skills

Let the plugin act on skills whose steps leave the session note. The MVPs make
the model aware of every vault skill and able to follow the single-note ones.
The rest are declined by name, which is honest but not useful.

## Problem

The MVP tools resolve an anchor inside the open note and edit there. That is
the whole capability, so it is also the whole limit.

Of a typical vault, one skill fits. A todo archiver moves ticked items to the
bottom of the file it is already in. A journal skill creates a file at a
computed path, a reference skill routes a topic into a taxonomy of folders, a
shopping list skill reads a meal plan and a staples log elsewhere in the vault.
Three of the four are declined.

The decline message is the MVP behaviour working as designed (FR37). Removing
the need for it is this release.

## Goals

- Read and write vault files other than the session note.
- Load a skill's full instructions when the model judges it relevant.
- Keep undo working across every write the plugin makes.
- Keep the trust boundary the MVPs establish.

## Non-goals

- Executing scripts. Skills stay markdown instructions.
- Authoring or editing skills from inside the plugin.
- Skills at user level, outside the vault.
- Deleting files.

## User stories

- As a user with a todo file open, I say "archive the done items" and the model
  follows the vault's archiving workflow rather than improvising.
- As a user dictating a thought, I say "put this in today's journal" and the
  entry lands at the path the journal skill computes.
- As a user who has just had a cross-file edit applied, I press undo once and
  the vault is as it was.

## Functional requirements

FR1. Give the model a way to request one skill's full body when it judges the
skill relevant.

FR2. Feed a requested body into the same turn, so the model acts on it without
the user repeating themselves.

FR3. Load each skill body at most once per turn.

FR4. Read a named note in the vault into the model's context.

FR5. Create a note at a given path, creating parent folders as needed.

FR6. Append to, or edit within, a note other than the session note.

FR7. Narrow the unsupported-skill message to whatever remains out of reach,
rather than covering every cross-file skill.

FR8. Summarise every file touched by a turn, so a multi-file edit is legible
after the fact.

FR9. Resolve each write target's AGENTS.md chain before writing to it, so a
note created outside the session note's folder follows its destination's
standing instructions.

## Non-functional requirements

NFR1. A turn undoes in one step from the user's point of view, including its
writes to files other than the session note.

NFR2. The agent loop's existing iteration cap still bounds a turn that loads
skills and touches files.

NFR3. Skill files stay user content, not trusted input. A skill cannot grant
the model a tool it does not have, nor widen the paths it may write.

NFR4. A write outside the vault is refused regardless of what a skill asks for.

## Decisions

Skill bodies load on demand rather than eagerly. Injecting every body would
spend most of the context window on skills the utterance does not concern.
Descriptions exist precisely to support that choice, and the MVP already
proves they are enough to route on.

The model keeps deciding which skills apply. Nothing in frontmatter declares
scope, per the MVP decision, and this release does not add one.

## Open questions

Undo is the hard part and gates the design. `app.vault.modify` writes outside
the editor's undo stack, so a turn spanning several files can leave the user
with a half-undoable change. Options to weigh in the design: route every write
through an open editor, stage writes and apply them as one transaction, or
keep a plugin-level undo log that restores prior content.

Resolve it in [3-component-design.md](3-component-design.md) before building.
