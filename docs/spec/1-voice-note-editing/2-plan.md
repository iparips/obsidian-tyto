# Release Plan: Voice Note Editing

Five releases. The MVPs prove the core loop with the simplest capture path, record-then-transcribe, and follow the host vault's single-note skills. The V1s add realtime streaming and polish. Release 5 lifts the single-note limit so cross-file skills become actionable. Requirement IDs refer to [1-requirements.md](1-requirements.md), except release 5, which carries its own.

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

## 3. Desktop V1

Goal: the specced experience - live transcript, safety options, polish.

- Realtime streaming transcription; transcript streams into the sidebar while speaking (FR6, FR7). Design the capture layer with the mobile token-auth path in mind, so Mobile V1 reuses it.
- OpenAI as the second provider, selectable in settings (FR26-28).
- Review-first mode with diff preview and accept/reject (FR23 setting, FR24).
- Transcription language setting plus frontmatter override (FR30).
- Microphone selection (FR31).
- Error notices naming the failing step (NFR5); latency target under 5 seconds (NFR2).

Exit test: dictating a mixed prose-and-structure paragraph feels live, and a rejected edit leaves the note untouched.

## 4. Mobile V1

Goal: streaming parity on mobile, then public release.

- Realtime streaming via ephemeral client tokens (NFR3).
- Automatic fallback to batch when a token mint fails.
- Mobile polish: mic lifecycle across app switches, drawer ergonomics.
- Community plugin submission.

Exit test: the desktop V1 exit test passes on mobile, and a token-mint failure degrades gracefully to batch.

## 5. Cross-File Skills

Goal: lift the single-note limit, so the vault skills that route between files become actionable rather than declined.

- File tools beyond the session note: read a named note, create one at a computed path, append to one.
- Undo story for writes that bypass `NoteEditor`, since `app.vault.modify` breaks native undo.
- Skill bodies loaded on demand, so a matched skill's full steps reach the model rather than its description alone.
- The FR37 refusal narrows to whatever remains unsupported, rather than covering every cross-file skill.

Detailed design: [5-cross-file-skills/index.md](5-cross-file-skills/index.md).

Exit test: with the vault's todo skill present, an instruction to archive done items follows the skill's steps rather than improvising, and the journal skill files an entry at the right computed path.
