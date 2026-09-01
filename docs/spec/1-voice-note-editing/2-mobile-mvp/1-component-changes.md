# Mobile MVP: Component Changes

Three components change; nothing else does. manifest.json drops isDesktopOnly.

## VoiceEditPlugin (src/main.ts)

- Registers the session-start command with the mobile toolbar in mind: Obsidian surfaces any command in the mobile toolbar once the user adds it, so the plugin ships an icon on the command and documents adding it to the toolbar (FR1).
- No Platform branching in main.ts; the command works identically on both platforms.

## Recorder (src/capture/recorder.ts)

Mime type probing replaces the fixed webm preference.

```typescript
const MIME_PREFERENCES = ['audio/webm', 'audio/mp4', 'audio/aac']

// pick the first for which MediaRecorder.isTypeSupported returns true
```

- iOS WebKit records audio/mp4 (AAC); Android records audio/webm (Opus). The chosen type rides with the blob, and MistralProvider passes it through to the multipart request (no client-side transcoding).
- Permission is requested lazily on first record; a denial surfaces as a transcription-step error entry.
- App backgrounding mid-recording stops and discards, with a notice. Configurable behaviour is Mobile V1 scope.

## SessionPanel (src/session/SessionPanel.tsx)

- CSS only: minimum 44px touch targets on mic, send and cancel; no hover-dependent affordances (FR33).
- The drawer presentation is native Obsidian behaviour for right-sidebar views on mobile; no code change (FR3).

## Vault Skills

No code delta. SkillLoader (Skills) reads through `app.vault.adapter`, which Obsidian implements on both platforms, so the catalogue builds the same way on a phone.

The path shape is what makes this work, and it is a constraint rather than a preference. Obsidian Sync copies no dot-folder to a phone except `.obsidian` and `.trash`, and the mobile adapter has no symlink support, so neither a dot-path nor a link to one ever arrives. Discovery therefore targets a normal vault folder, with the agent harness paths symlinked to it on desktop.

Verify on a real device that `adapter.list()` resolves the configured skills path and returns the skill folders. A vault whose skills still live in a dot-folder produces an empty catalogue on mobile and a populated one on desktop, which is the symptom to expect if the vault has not been migrated.
