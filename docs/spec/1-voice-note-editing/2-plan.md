# Release Plan: Voice Note Editing

Five releases. The MVPs prove the core loop with the simplest capture path, record-then-transcribe. The V1s add realtime streaming and polish. Release 5 teaches the plugin the host vault's own conventions. Requirement IDs refer to [1-requirements.md](1-requirements.md), except release 5, which carries its own.

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

Cut from this release: streaming, review-first mode, mobile, language settings, mic selection, OpenAI provider.

Exit test: the example instructions from the requirements work end to end on a real note.

## 2. Mobile MVP

Goal: same loop on a phone. Cheap because batch transcription uses plain REST, no WebSocket auth issues.

- Mobile toolbar button starts the session (FR1).
- Sidebar opens as slide-over drawer; controls tappable (FR3, FR33).
- Mobile audio capture with record-then-transcribe.
- Everything else carries over unchanged (FR32).

Exit test: the desktop exit test passes on iOS and Android.

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

## 5. Repo Skills

Goal: the plugin follows the host vault's own agent skills, so a spoken instruction gets the same treatment it would from any other harness.

- Discover `.agents/skills/*/SKILL.md` through the vault adapter, since dot-directories are invisible to the file API.
- Inject skill names and descriptions into the system prompt; load a full body only when the model asks for it.
- Behave exactly as before in a vault with no skills directory.

Detailed design: [5-repo-skills/index.md](5-repo-skills/index.md).

Cut from this release: file writes beyond the session note, which several skills need before they are fully actionable.

Exit test: with the vault's todo skill present, an instruction to archive done items follows the skill's steps rather than improvising.
