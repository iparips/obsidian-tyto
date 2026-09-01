# Mobile MVP: Testing Strategy

## Unit Test Deltas

### Recorder (capture/recorder.test.ts, added cases)

Three cases exist already: stop resolves with blob and mime type, permission
denial fails at the transcription step, and cancel discards. Add:

- picks audio/webm when it is the first supported type
- falls back to audio/mp4 when webm is unsupported
- falls back to the browser default when no listed type is supported

The existing "resolves with blob and mime type" case already covers the type
riding with the blob, so it needs no duplicate.

### SessionPanel (session/SessionPanel.test.tsx, added case)

- discards the recording and returns to idle when the document becomes hidden

Drive it by dispatching `visibilitychange` with `document.hidden` stubbed true.

### MistralProvider (providers/mistral-provider.test.ts, added case)

- names the file with the blob's extension when the mime type is audio/mp4

## Debugging On Device

Unit tests cannot reach webview behaviour, so a failure on a phone needs a
console. [mobile-debugging.md](../../../mobile-debugging.md) covers attaching
Chrome DevTools over adb for Android, which is the faster of the two loops. iOS
needs Safari Web Inspector with a Mac.

Log these before running the matrix, since each answers a question the symptom
alone does not:

- The mime type chosen at `beginRecording`, and whether it came from the
  preference list or the empty-string default.
- The blob size at `stop`. A zero-byte blob separates a capture failure from a
  transcription failure.
- The skills path and the folder count `adapter.list()` returned.

## Manual Device Matrix

The release risk is webview behaviour. Run the Desktop MVP exit test on each row.

| Device        | OS      | Checks                                                  |
| ------------- | ------- | ------------------------------------------------------- |
| iPhone        | iOS     | mp4 capture, drawer with keyboard open, permission flow |
| Android phone | Android | webm capture, drawer with keyboard open, permission flow |

Also verify:

- Recording while the drawer is open.
- Backgrounding mid-recording shows the discard notice and returns to idle.
- Toolbar command reachable with the keyboard up.
- Touch targets usable one-handed; the copy button on a history entry is
  reachable without hover.

### Vault Skills

- Skills discovered on device match the desktop catalogue for the same vault.
- An instruction matching a single-note skill behaves as it does on desktop.
- A vault with the skills folder absent starts a session with no error.

## Exit

The matrix passing on both rows is what allows isDesktopOnly to drop from
manifest.json. Until then the plugin stays desktop-only in the manifest, even
with the code merged.
