# Mobile MVP: Testing Strategy

## Unit Test Deltas

### Recorder (capture/recorder.test.ts, added cases)

- picks audio/webm when it is the first supported type
- falls back to audio/mp4 when webm is unsupported
- reports the chosen mime type with the blob when recording stops
- stops and discards when the app backgrounds mid-recording

### MistralProvider (providers/mistral-provider.test.ts, added case)

- sends the blob's mime type in the multipart request when transcribing

## Manual Device Matrix

The release risk is webview behaviour, which unit tests cannot cover. Run the Desktop MVP exit test on each row.

| Device        | OS      | Checks                                                   |
| ------------- | ------- | -------------------------------------------------------- |
| iPhone        | iOS     | mp4 capture, drawer with keyboard open, permission flow  |
| Android phone | Android | webm capture, drawer with keyboard open, permission flow |

- Also verify: recording while the drawer is open, backgrounding mid-recording shows the discard notice, toolbar command reachable with the keyboard up.

### Vault Skills

- Skills discovered on device match the desktop catalogue for the same vault.
- An instruction matching a single-note skill behaves as it does on desktop.
- A vault with the skills folder absent starts a session with no error.
