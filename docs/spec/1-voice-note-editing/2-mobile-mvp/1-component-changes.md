# Mobile MVP: Component Changes

Four components change; nothing else does. manifest.json drops isDesktopOnly,
in the same commit that the device matrix in
[2-testing-strategy.md](2-testing-strategy.md) passes, not before. Shipping the
flag earlier exposes the plugin to phones it has not been run on.

## VoiceEditPlugin (src/main.ts)

- The session-start command gains an `icon` property. It has none today, and
  Obsidian needs one before the command can be added to the mobile toolbar
  (FR1). Use the same `mic` icon the ribbon already uses.
- Obsidian surfaces any command in the mobile toolbar once the user adds it, so
  the work is the icon plus a line in the README on adding it.
- No Platform branching; the command works identically on both platforms.

## Recorder (src/capture/recorder.ts)

### Current behaviour

The recorder already probes, in a narrower form than this release needs. Read
`beginRecording` and `takeUtterance` before changing either.

- `beginRecording` sets the type to `audio/webm` when
  `MediaRecorder.isTypeSupported` allows it, and to `''` otherwise, which lets
  the browser pick its own.
- `takeUtterance` already falls back to `recorder.mimeType`, so the type the
  browser actually chose rides with the blob. iOS capture therefore reports mp4
  today without any change.

### Change

Replace the single preference with an ordered list.

```typescript
const MIME_PREFERENCES = ['audio/webm', 'audio/mp4', 'audio/aac']

// first type for which MediaRecorder.isTypeSupported returns true, else ''
```

Keep `''` as the final fallback and keep the `takeUtterance` behaviour as it is.
The empty string is not a failure case: it is how the browser is asked to
choose, and it is what makes an unlisted codec still work.

iOS WebKit records mp4 (AAC); Android records webm (Opus). MistralProvider
passes the type through to the multipart request, deriving the filename
extension from it in `MistralMapper.fileNameFor`. There is no client-side
transcoding.

### Backgrounding

A recording that survives into the background produces a truncated or silent
blob, so it is discarded rather than transcribed.

- SessionPanel owns the recorder, so it observes visibility, not the Recorder.
- Use `registerDomEvent(document, 'visibilitychange', ...)` from the plugin so
  Obsidian detaches the listener on unload.
- On `document.hidden` while recording: call `cancel()`, return the panel to
  idle, and show a notice saying the recording was discarded.
- Configurable behaviour, such as resuming or keeping the partial audio, is
  Mobile V1 scope.

Permission is requested lazily on first record; a denial surfaces as a
transcription-step error entry, as it does on desktop.

## SessionPanel (src/session/SessionPanel.tsx)

- Touch targets of at least 44px on mic, send and cancel. styles.css has no size
  rules today, so this is new CSS rather than an adjustment.
- No hover-dependent affordances (FR33). The copy button on history entries
  currently reveals on hover, so it needs a mobile rule that keeps it visible.
- The drawer presentation is native Obsidian behaviour for right-sidebar views
  on mobile; no code change (FR3).

## Vault Skills

No code delta. SkillRepository (Skills) reads through `app.vault.adapter`, which
Obsidian implements on both platforms, so the catalogue builds the same way on a
phone.

The path shape is what makes this work, and it is a constraint rather than a
preference. Obsidian Sync copies no dot-folder to a phone except `.obsidian` and
`.trash`, and the mobile adapter has no symlink support, so neither a dot-path
nor a link to one ever arrives. Discovery therefore targets a normal vault
folder, with the agent harness paths symlinked to it on desktop.

Verify on a real device that `adapter.list()` resolves the configured skills
path and returns the skill folders. A vault whose skills still live in a
dot-folder produces an empty catalogue on mobile and a populated one on desktop,
which is the symptom to expect if the vault has not been migrated.
