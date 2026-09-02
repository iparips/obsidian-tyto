# Requirements: AGENTS.md Loading

Let a folder set standing instructions for the notes inside it. The MVPs give
the model one prompt, identical for every note in the vault.

## Problem

A vault is not uniform. A journal folder wants second person and a date
heading. A clients folder wants full names, never abbreviations. A drafts
folder wants the model to leave prose alone and only fix structure.

Skills do not cover this. A skill is conditional, matched against an utterance,
and loaded by description. These instructions are unconditional: they apply to
every turn on a note, whatever the user said.

The settings tab could hold one instruction box, vault-wide. That solves the
uniform case and none of the above, because the interesting rules differ per
folder rather than per vault.

## Goals

- Give a folder a way to state instructions for the notes beneath it.
- Derive which instructions apply from the path of the note being written to,
  not from settings and not from which note started the session.
- Let a nearer folder override a further one.
- Keep the per-turn prompt cost bounded and visible.

## Non-goals

- Instruction files outside the vault. The mobile adapter cannot read there, so
  a user-level file would make mobile silently differ from desktop.
- An include mechanism. One instruction file is one file this release.
- Reconciling a folder that holds both files. One per folder is the rule, so a
  divergent pair is not a case the release handles.
- Per-note frontmatter instructions.
- Authoring or editing AGENTS.md from inside the plugin.
- Instructions from a note the model only reads. Those govern writes into that
  folder, not the edit in hand, and loading them would let any read pull
  arbitrary instructions into the prompt.

## User stories

- As a user with a journal folder, I write its house style once in
  Journal/AGENTS.md and every note in it follows the style.
- As a user whose vault root sets a rule, I override it for one folder by
  putting a narrower AGENTS.md there.
- As a user filing an entry into a folder other than the one I started the
  session in, the entry follows the destination folder's rules.
- As a user wondering why a note behaved oddly, I see in the panel which
  instruction files applied.

The numbered requirements: [2-functional-requirements.md](2-functional-requirements.md).
Decisions taken and questions still open: [5-decisions.md](5-decisions.md).
