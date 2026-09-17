---
created: 2026-09-11
updated: 2026-09-11
---

# README Disclosures

A new section, placed after "What it does not do" so a reader meets it before
the install steps. It answers the three disclosure rules in one place.

Content, not wording.

Which service

- Mistral, at api.mistral.ai, and nothing else.

What is sent

- Spoken audio, for transcription.
- The instruction, the text of the note in the session, any matched skill, any
  AGENTS.md in the note's folder chain, and search excerpts where search is on.

When

- Only during a turn the user starts. Nothing is sent in the background.

Why

- The plugin is an instruction parser, and the parsing is the model's. There is
  no local model that turns free speech into a note edit.

The account

- A Mistral API key is required; without one the plugin does nothing.
- The key is stored in the vault's plugin folder and sent only to Mistral.

The transcript

- Off by default. Turning it on adds a copy button that puts note text and
  vault instructions on the clipboard.

What never leaves

- No telemetry, no analytics, no other host.

The existing "What it does not do" list keeps its Mistral line. It reads as a
capability limit there, which is a different claim from the disclosure.
