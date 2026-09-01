# Requirements: Repo Skills

Load vault-specific skills into the system prompt, so the plugin follows the
same instructions the user's other agent harnesses follow. A skill is a
markdown file describing a workflow: how to archive todos, where a journal
entry belongs, how the reference tree is organised.

## Problem

The system prompt is fixed. It teaches the model to edit markdown, and nothing
about how this particular vault works.

The user's vault already holds that knowledge, in a form built for agents.
Skills live in `.agents/skills/<name>/SKILL.md`, discovered natively by Codex
and through a symlink by Claude Code. Four exist: journal, todo, reference,
shopping-list.

Voice Edit cannot see them. Saying "archive my todos" produces a literal edit
attempt rather than the workflow the todo skill describes.

## Goals

- Discover skills in the vault and make the model aware of them.
- Load a skill's full instructions only when it applies.
- Work identically on desktop and mobile.
- Change nothing for a vault with no skills directory.

## Non-goals

- Executing scripts. Skills are markdown instructions only.
- Writing to files other than the session note. See Deferred below.
- Authoring or editing skills from inside the plugin.
- Skills at user level, outside the vault.

## User stories

- As a user with a todo file open, I say "archive the done items" and the model
  follows the vault's archiving workflow rather than improvising.
- As a user whose vault has no skills, I notice no change in behaviour or
  latency.
- As a user on my phone, skills work exactly as they do on my laptop.

## Functional requirements

FR1. On session start, enumerate `.agents/skills/*/SKILL.md` in the vault.

FR2. Parse each skill's YAML frontmatter for `name` and `description`.

FR3. Inject the name and description of every discovered skill into the system
prompt. Bodies stay out at this stage.

FR4. Give the model a way to request one skill's full body when it judges the
skill relevant.

FR5. Feed a requested body into the same turn, so the model acts on it without
the user repeating themselves.

FR6. Load each skill body at most once per turn.

FR7. Treat a missing skills directory as an empty skill set.

FR8. Skip a malformed skill file rather than failing the turn.

## Non-functional requirements

NFR1. Phase-one cost stays proportional to skill count, not skill size. Ten
skills must not crowd out the note from the context window.

NFR2. Reading skills adds no perceptible latency to session start.

NFR3. Dot-directories are invisible to `app.vault.getFiles()`. Discovery must
use `app.vault.adapter`.

NFR4. Skill files are user content, not trusted input. A skill cannot grant the
model tools it does not have, nor widen what it may edit.

NFR5. The tool loop's existing iteration cap still bounds a turn that loads
skills.

## Decisions

Two-phase loading, not eager. Injecting every body would spend most of the
context window on skills the utterance does not concern. Descriptions are
cheap and exist precisely to support this choice.

Skills come from the vault, not from plugin settings. The vault is already the
canonical home, and duplicating them into settings would create the drift the
vault's own layout was arranged to avoid.

## Deferred

Loading a skill does not make it actionable. The current tools apply
anchor-based edits to the one open note. The todo skill moves text from the
middle of a file to its bottom, and the journal skill creates files at computed
paths. Neither is expressible today.

This release makes the model aware of skills and able to follow those that fit
the existing tools. Broader file access is its own release, and carries a
trade-off worth deciding deliberately: whole-file writes through
`app.vault.modify` bypass `EditApplier` and break native undo.
