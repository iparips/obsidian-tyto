# Mobile V1: Component Design

## EphemeralTokenAuth (src/providers/ephemeral-token-auth.ts)

Implements the RealtimeAuth seam from Desktop V1. One class, parameterised by the provider's mint endpoint.

- getCredentials() mints a short-lived client token via REST with the user's API key, returning the subprotocolToken variant.
- The API key travels only in the mint call; the WebSocket handshake carries the token in the subprotocol field, which the mobile webview can set.
- Tokens are minted per session start, never cached. A mid-utterance expiry surfaces as a socket drop and follows the drop handling from Desktop V1.
- Auth selection: Platform.isMobile picks EphemeralTokenAuth, desktop keeps DirectKeyAuth. The transports are untouched.

## Fallback (src/capture/streaming-transcriber.ts)

- A failed mint or refused connection drops the session to the batch path, one notice, retry on next session start. This reuses the Desktop V1 fallback; the only addition is treating mint failure like connection failure.

## Mic Lifecycle (src/capture/ + SessionPanel)

- New setting onBackground: 'stopAndSend' | 'stopAndDiscard', default stopAndSend; losing dictated content is worse than a truncated utterance.
- Backgrounding fires the visibilitychange handler: streaming sessions stop and resolve their final transcript, which is processed normally under stopAndSend.
- Audio interruptions (calls, another app taking the session) are handled identically to backgrounding.
- Returning to the app never auto-restarts the mic.

## Settings UI

- The onBackground dropdown appears in SettingsPanel, mobile section, with one line explaining the trade-off.
