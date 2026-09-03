# Desktop V1: Data Model

Additions to the MVP contracts in [1-desktop-mvp/2-data-model.md](../1-desktop-mvp/3-data-model.md). All in src/providers/types.ts unless noted.

## Realtime Contracts

```typescript
export interface RealtimeAuth {
  getCredentials(): Promise<Outcome<RealtimeCredentials>>
}

export type RealtimeCredentials =
  { kind: 'apiKey'; key: string } | { kind: 'subprotocolToken'; token: string }

export interface RealtimeTranscriptionProvider {
  openSession(auth: RealtimeAuth, language?: string): Promise<Outcome<RealtimeSession>>
}

export interface RealtimeSession {
  sendAudio(chunk: Int16Array): void
  onPartial(handler: (text: string) => void): void
  onFinal(handler: (text: string) => void): void
  stop(): Promise<Outcome<string>> // resolves with the final transcript
  close(): void
}
```

- DirectKeyAuth (desktop) returns the apiKey variant. EphemeralTokenAuth (Mobile V1) returns subprotocolToken; the interface ships now so the transport never sees key handling.
- Providers implement RealtimeTranscriptionProvider next to the existing batch TranscriptionProvider; batch stays as the fallback path.

## Widened Settings (src/settings/settings.ts)

```typescript
export interface VoiceEditSettings {
  provider: 'mistral' | 'openai'
  mistralApiKey: string
  openaiApiKey: string
  editModel: string // per-provider default applied when provider changes
  reviewFirst: boolean // default false
  language: string // '' means auto-detect
  microphoneDeviceId: string // '' means system default
}
```

- Frontmatter key owl-language overrides language per note (FR30).
- Provider selection picks which key and endpoints are used everywhere (FR28).

## Review Types (src/engine/review-controller.ts)

```typescript
export interface PendingTurn {
  operations: ValidatedOperation[]
  summary: string
}

export interface ValidatedOperation {
  op: EditOperation
  anchorContext: { before: string; after: string } // for diff rendering
}
```

A PendingTurn is accepted or rejected whole; there is no per-operation verdict.
