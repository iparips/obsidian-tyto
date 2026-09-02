# Release Plan: Voice Note Editing

Seven releases. The MVPs prove the core loop with the simplest capture path, record-then-transcribe, and follow the host vault's single-note skills. Release 3 makes behaviour depend on where a note sits. Release 4 widens the plugin from one bound note to the vault, through commands and search. The V1s add realtime streaming and polish. Release 7 lifts the single-note write limit so cross-file skills become actionable. Requirement IDs refer to [1-requirements.md](1-requirements.md), except releases 3, 4 and 7, which carry their own.

## Table of Contents

1. [Desktop MVP](#1-desktop-mvp)
2. [Mobile MVP](#2-mobile-mvp)
3. [AGENTS.md Loading](#3-agentsmd-loading)
4. [Obsidian Agent Harness](#4-obsidian-agent-harness)
5. [Desktop V1](#5-desktop-v1)
6. [Mobile V1](#6-mobile-v1)
7. [Cross-File Skills](#7-cross-file-skills)

## 1. Desktop MVP

Goal: prove the loop - speak an instruction, see the note change.

- Session start via ribbon icon and hotkey (FR1), bound to one note (FR2).
- Sidebar view with conversation history (FR3, FR4).
- Record-then-transcribe capture: record an utterance, send on stop (FR5, simplified FR6).
- Transcription shown in the sidebar after each utterance (FR7).
- Typed input box (FR8).
- Edit engine with function calling: anchored replace and insert, clarifying questions, multi-op turns (FR9-14).
- Dictation with formatting: classification, cleanup, mixed prose and markdown (FR15-21).
- Apply immediately via editor API, cursor follows the edit (FR22, FR23 default, FR25).
- Provider interface with Mistral as the only implementation (FR26).
- Settings: API key, model selection (FR28, FR29).
- Vault skills: discover them, list them in the prompt, follow the single-note ones, refuse the rest with a reason (FR34-38).

Cut from this release: streaming, review-first mode, mobile, language settings, mic selection, OpenAI provider, cross-file skills.

Exit test: the example instructions from the requirements work end to end on a real note, and an instruction matching a cross-file skill is declined by name rather than half-applied.

## 2. Mobile MVP

Goal: same loop on a phone. Cheap because batch transcription uses plain REST, no WebSocket auth issues.

- Mobile toolbar button starts the session (FR1).
- Sidebar opens as slide-over drawer; controls tappable (FR3, FR33).
- Mobile audio capture with record-then-transcribe.
- Vault skills resolve through the mobile adapter, same catalogue as desktop (FR34, FR32).
- Everything else carries over unchanged (FR32).

Exit test: the desktop exit test passes on iOS and Android, skills included.

## 3. AGENTS.md Loading

Goal: let a folder set the standing instructions for the notes inside it, via AGENTS.md or CLAUDE.md.

- Walk the path from the vault root down to the folder holding the note being written to, taking one instruction file per folder (FR1, FR3).
- Prefer AGENTS.md, falling back to CLAUDE.md where a folder has none (FR2).
- Concatenate root first, so the nearest folder's instructions read last and win (FR4).
- Inject the result as its own prompt section, ahead of the skill catalogue (FR5).
- Resolve per write target, not per session, and cache by folder (FR7, FR12).
- Cap the total loaded, and report which folders applied in the panel (FR8, FR9).
- Notify and log to the console when the cap drops a file (FR13-FR15).

Detailed design: [3-agents-md-loading/index.md](3-agents-md-loading/index.md).

Exit test: two notes in sibling folders with different AGENTS.md files produce visibly different behaviour for the same utterance, rebinding between them swaps the rules, and a vault with none behaves byte for byte as release 2.

## 4. Obsidian Agent Harness

Goal: stop the session being trapped in one note. Two flows, sharing only the agent loop.

- Command catalogue behind a user-editable allow-list, entries being ids or namespace patterns, injected into the prompt like the skill catalogue (FR1-FR11).
- A tool that runs one allowed command, reporting what opened (FR12-FR16).
- Session rebinds to the note a command opened, so the edit tools target it (FR17-FR21).
- Search and read tools, bounded by result count, excerpt length and per-turn call count (FR22-FR26).
- A search answer renders as a copyable panel block citing its source notes, never written into a note (FR27-FR30).
- Commands beat search when an utterance names a destination; no command match is said plainly rather than guessed at (FR31-FR33).

The write destination always comes from a command, never from a path the model picked. Search-and-edit waits for a later release, for the same reason cross-file writes do.

Detailed design: [4-obsidian-agent-harness/index.md](4-obsidian-agent-harness/index.md).

Exit test: "open my daily note and add a paragraph under Meetings" opens the note and edits it, "what did I write about the roofing quote recently" returns a copyable summary naming its sources and touches no note, and a vault with an empty allow-list behaves byte for byte as release 3.

## 5. Desktop V1

Goal: the specced experience - live transcript, safety options, polish.

- Realtime streaming transcription; transcript streams into the sidebar while speaking (FR6, FR7). Design the capture layer with the mobile token-auth path in mind, so Mobile V1 reuses it.
- OpenAI as the second provider, selectable in settings (FR26-28).
- Review-first mode with diff preview and accept/reject (FR23 setting, FR24).
- Transcription language setting plus frontmatter override (FR30).
- Microphone selection (FR31).
- Error notices naming the failing step (NFR5); latency target under 5 seconds (NFR2).

Exit test: dictating a mixed prose-and-structure paragraph feels live, and a rejected edit leaves the note untouched.

## 6. Mobile V1

Goal: streaming parity on mobile, then public release.

- Realtime streaming via ephemeral client tokens (NFR3).
- Automatic fallback to batch when a token mint fails.
- Mobile polish: mic lifecycle across app switches, drawer ergonomics.
- Community plugin submission.

Exit test: the desktop V1 exit test passes on mobile, and a token-mint failure degrades gracefully to batch.

## 7. Cross-File Skills

Goal: lift the single-note limit, so the vault skills that route between files become actionable rather than declined.

- File tools beyond the session note: read a named note, create one at a computed path, append to one.
- Undo story for writes that bypass `NoteEditor`, since `app.vault.modify` breaks native undo.
- Skill bodies loaded on demand, so a matched skill's full steps reach the model rather than its description alone.
- The FR37 refusal narrows to whatever remains unsupported, rather than covering every cross-file skill.
- Each write resolves its own target's AGENTS.md chain, per release 3.
- Each write resolves its own target's AGENTS.md chain, per release 3.

Detailed design: [7-cross-file-skills/index.md](7-cross-file-skills/index.md).

Exit test: with the vault's todo skill present, an instruction to archive done items follows the skill's steps rather than improvising, and the journal skill files an entry at the right computed path.
