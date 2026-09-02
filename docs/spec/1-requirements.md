# Requirements: Voice Note Editing

An Obsidian plugin that edits the active note from natural-language instructions, spoken or typed. It works like an agent editing a file: it reads the note, plans an edit, and applies it. It also takes dictated content and writes it into the note with sensible formatting. Transcription and interpretation go through a provider-agnostic layer; Mistral is the default provider, OpenAI the second.

## Table of Contents

1. [Problem](#problem)
2. [Goals](#goals)
3. [Non-goals](#non-goals)
4. [User stories](#user-stories)
5. [Functional requirements](#functional-requirements)
6. [Non-functional requirements](#non-functional-requirements)
7. [Decisions](#decisions)

## Problem

Existing dictation plugins rely on fixed voice-command phrases and cannot perform arbitrary edits. The user wants to say "rename heading X to Y" or "add a list A, B, C under heading X" and have the note change accordingly, without memorising command phrases.

## Goals

- Edit a single markdown note through free-form natural language.
- Accept input by voice or typed text.
- Understand structural intent: headings, lists, sections, ordering, renames.
- Apply edits precisely, leaving the rest of the note untouched.
- Take dictated content and place it in the note, formatted intelligently, with no fixed command phrases.

## Non-goals

- Multi-file or vault-wide edits.
- Content generation beyond what the user says (no "write me an essay" focus, though short generated content within an edit is fine).
- Offline or local-model operation in v1.

## User stories

- As a user, I open a note, start an edit session, and speak an instruction. The note updates.
- As a user, I say "at the start of the file, make a list of A, B, C under a heading X". The plugin inserts the heading and list at the top.
- As a user, I say "rename heading X to Y". Only that heading line changes.
- As a user, I say "add a list under heading Y" and then dictate the items.
- As a user, I review a proposed edit before it lands, or configure edits to apply immediately.
- As a user, I undo a bad edit with standard Obsidian undo.
- As a user, I type an instruction instead of speaking when I am in a meeting.
- As a user, I dictate a few sentences of content and they land in the note as clean prose.
- As a user, I mix content and structure in one utterance: "heading meeting notes, then the attendees as a list: Anna, Ben". The note gets a heading and a list.

## Functional requirements

### Session

- FR1: A session starts from a ribbon icon and hotkey on desktop, and a mobile toolbar button on mobile.
- FR2: The session is bound to one note. Switching notes ends or rebinds the session explicitly.
- FR3: A sidebar view shows the conversation: instructions given and edits made. On mobile it opens as the standard slide-over drawer.
- FR4: The session keeps conversation history, so follow-ups work ("actually make that heading level 2").

### Voice and text input

- FR5: The mic toggles per utterance: start speaking, stop, and that utterance is processed as one unit.
- FR6: The provider's realtime streaming transcription is used, via the user's API key. Desktop authenticates the WebSocket directly; mobile uses ephemeral client tokens.
- FR7: The live transcript streams into the sidebar while speaking, so mishearings are visible before the edit lands.
- FR8: A text box accepts typed input as an equal alternative to voice.

### Edit engine

- FR9: The provider's chat model receives the note content plus the instruction and produces edits.
- FR10: Edits are expressed as function calls with a typed schema per operation (replace with exact anchor, insert-at-anchor), not a full-file rewrite, so unrelated content cannot drift.
- FR11: The engine handles instructions referencing structure: "under heading Y", "at the start", "after the second list item", "the section about Z".
- FR12: Ambiguous instructions produce a clarifying question in the panel, not a guess that rewrites the note.
- FR13: Failed anchor matches are reported, never silently dropped or fuzzily applied.
- FR14: Multi-step instructions ("rename X to Y and add a list under it") execute as one turn with multiple operations.

### Dictation

- FR15: Spoken content, not just commands, is accepted. The engine classifies each utterance as content, instruction, or a mix. No mode toggle; the model decides.
- FR16: Dictated content is cleaned up before insertion: filler words dropped, punctuation and capitalisation fixed, self-corrections ("no, not X, Y") resolved.
- FR17: The engine formats dictated content to fit the note: prose stays prose, enumerations become lists, spoken structure cues become headings.
- FR18: Prose and markdown structure mix freely in one utterance. "Today I looked at three options, first A, second B, third C, I am leaning towards B" yields a sentence, a numbered list, and a closing sentence.
- FR19: Formatting intent is inferred from natural phrasing, not fixed trigger phrases. "Make that a quote" or "as a checklist" work, but so does implied structure.
- FR20: The full markdown vocabulary is available: headings, bullet and numbered lists, checklists, quotes, code blocks, tables, bold and italic, links.
- FR21: Content lands at the cursor by default, or where the utterance directs ("under heading Y").

### Applying edits

- FR22: Edits apply through the Obsidian editor API, so native undo history works.
- FR23: Edits apply immediately by default. A setting switches to review-first mode.
- FR24: Review-first mode shows a diff or highlighted preview with accept and reject controls.
- FR25: The cursor and scroll position move to the edited region after an edit applies.

### Providers

- FR26: Transcription and chat sit behind a provider interface. Mistral is the default; OpenAI is a first-class second provider.
- FR27: A provider must offer streaming speech-to-text with ephemeral client tokens, a chat model with function calling, and a no-training-by-default API policy.

### Settings

- FR28: Provider selection and an API key field per provider.
- FR29: Model selection for the edit engine, with a sensible default per provider.
- FR30: Transcription language setting, plus per-note override via frontmatter.
- FR31: Microphone selection on desktop.

### Platforms

- FR32: All features work on desktop and mobile: voice capture, transcription, editing, dictation.
- FR33: The session UI fits a phone screen; controls are tappable, not hover-dependent.

### Vault skills

- FR34: On session start, discover the vault's agent skills and read the name and description of each.
- FR35: Inject those names and descriptions into the system prompt, so the model knows which workflows the vault defines.
- FR36: Follow a skill whose work stays inside the session note.
- FR37: Tell the user plainly when a matched skill needs to read or write other files, naming the skill and saying the capability is not supported yet.
- FR38: Behave exactly as before in a vault with no skills.

## Non-functional requirements

- NFR1: Note content and instructions go only to the selected provider's API, using the user's own key. No middleman service, no telemetry.
- NFR2: A short instruction round-trip (transcribe plus edit) should feel responsive, target under 5 seconds.
- NFR3: Works on desktop and mobile. The mobile webview cannot set custom auth headers on WebSockets, so realtime transcription there uses the provider's ephemeral client tokens; batch record-then-transcribe is the fallback.
- NFR4: The plugin never writes to any file other than the session's note.
- NFR5: API errors surface as clear notices with the failing step named (transcription vs edit).
- NFR6: Skill discovery adds no perceptible latency to session start, and its prompt cost scales with skill count, not skill size.
- NFR7: Skill files are user content, not trusted input. A skill cannot grant the model a tool it does not have, nor widen what it may edit.

## Decisions

- Provider: provider-agnostic layer from day one. Mistral default, OpenAI second. Both have no-training-by-default API policies; privacy is the selection bar, not geography.
- Apply mode: apply immediately by default, review-first as a setting. Obsidian undo is the safety net.
- Edit format: function calling with one typed tool per operation. Revisit only if long-content edits degrade inside JSON strings.
- Session UI: sidebar view, slide-over drawer on mobile. Mic trigger: ribbon icon and hotkey on desktop, mobile toolbar button on mobile.
- Capture: realtime streaming transcription from v1. The transcript streams into the sidebar; the note changes per utterance, after the model processes the complete transcript.
- Classification: implicit; the model decides content vs instruction per utterance. No mode toggle.
- Flush timing: per utterance. One mic start-stop cycle is one unit of processing.
- Skill scope: the model judges whether a skill fits the single-note tools, rather than the skill declaring a scope in frontmatter. A declared flag would be one more thing to forget when authoring a skill, and it would go stale; the tool list is the real constraint, so the judgement belongs where the utterance is.
