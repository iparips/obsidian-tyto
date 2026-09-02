# Desktop V1: OpenAI Provider

OpenAIProvider (src/providers/openai-provider.ts) implements the same four contracts as MistralProvider: batch transcription, chat, realtime transcription, and realtime auth (FR26). All provider differences stay inside this file and its transport helpers; EditEngine, capture and UI see one shape.

## Endpoint Mapping

| Contract               | Mistral                       | OpenAI                                       |
| ---------------------- | ----------------------------- | -------------------------------------------- |
| Batch transcription    | POST /v1/audio/transcriptions | POST /v1/audio/transcriptions                |
| Chat with tools        | POST /v1/chat/completions     | POST /v1/chat/completions                    |
| Realtime transcription | Voxtral realtime WebSocket    | Realtime API WebSocket, transcription intent |
| Ephemeral token mint   | client-token REST endpoint    | client secret REST endpoint                  |

- Default edit model per provider: mistral-medium-latest, gpt-4o-mini; applied when the provider dropdown changes and the model field still holds the other provider's default (FR29).
- Tool-call and message format differences are normalised in each provider's mapping layer; both emit the shared ChatTurn and ToolCall types.
- Realtime event names differ (partial and final transcript events); each provider maps its events onto onPartial and onFinal.

## Settings UI Additions (SettingsPanel.tsx)

- Provider dropdown: Mistral, OpenAI.
- One password-style key field per provider; both stored, only the selected one used (FR28).
- Language dropdown and microphone device picker (FR30, FR31); devices enumerated via enumerateDevices after permission.
- Review-first toggle (FR23).

## Verification

- Provider parity is asserted by a shared contract test: the same test suite runs against both providers with fetch and WebSocket mocked, so behaviour cannot drift (see [5-testing-strategy.md](5-testing-strategy.md)).
