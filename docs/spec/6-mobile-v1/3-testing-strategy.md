# Mobile V1: Testing Strategy

## Unit Additions

### EphemeralTokenAuth (providers/ephemeral-token-auth.test.ts)

- returns a subprotocol token when the mint succeeds
- returns a transcription-step failure when the mint is refused
- mints a fresh token when a new session starts

### StreamingTranscriber additions

- falls back to batch when the token mint fails
- stops and sends the transcript when the app backgrounds under stopAndSend
- stops and discards when the app backgrounds under stopAndDiscard

### Auth selection

- picks EphemeralTokenAuth when the platform is mobile
- picks DirectKeyAuth when the platform is desktop

## Device Matrix

Run the Desktop V1 exit test per row, plus the degradation checks.

| Device        | Checks                                                                               |
| ------------- | ------------------------------------------------------------------------------------ |
| iPhone        | streaming via token, mint-failure fallback to batch, call interruption mid-utterance |
| Android phone | streaming via token, mint-failure fallback to batch, app-switch mid-utterance        |

- Verify the API key never appears in the WebSocket handshake (proxy inspection once per provider).
