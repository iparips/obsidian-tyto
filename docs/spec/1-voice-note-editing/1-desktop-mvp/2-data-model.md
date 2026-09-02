# Desktop MVP: Data Model

All shared types, written first so modules can be built in parallel against them. Everything below lives in src/providers/types.ts or src/engine/outcome.ts unless noted.

## Outcome

```typescript
export type Outcome<T> =
  { ok: true; value: T } | { ok: false; step: 'transcription' | 'chat' | 'apply'; message: string }
```

The step field feeds NFR5: error notices name the failing step.

## Provider Contracts

```typescript
export interface TranscriptionProvider {
  transcribe(audio: Blob, mimeType: string): Promise<Outcome<string>>
}

export interface ChatProvider {
  complete(messages: ChatMessage[], tools: ToolSchema[]): Promise<Outcome<ChatTurn>>
}

export type ChatMessage =
  | { role: 'system' | 'user' | 'assistant'; content: string }
  | { role: 'assistant'; toolCalls: ToolCall[] }
  | { role: 'tool'; toolCallId: string; content: string }

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
}

export type ChatTurn = { kind: 'toolCalls'; calls: ToolCall[] } | { kind: 'text'; content: string }

export interface ToolSchema {
  name: string
  description: string
  parameters: Record<string, unknown>
}
```

## Edit Operations (src/engine/note-editor.ts)

```typescript
export type EditOperation =
  | { kind: 'replace'; anchor: string; replacement: string }
  | { kind: 'insert'; anchor: string; position: 'before' | 'after'; content: string }
  | { kind: 'insertAt'; location: 'noteStart' | 'noteEnd' | 'cursor'; content: string }

export type ApplyResult =
  { applied: true } | { applied: false; reason: 'noMatch' | 'multipleMatches' }
```

ApplyResult failures are serialised into the tool message so the model can retry (FR13).

## Session State (src/session/agent-session.ts)

```typescript
export class AgentSession {
  chatHistory: ChatMessage[] = []
  operationHistory: EditOperation[] = []

  constructor(readonly file: TFile) {}
}
```

History persists for the sidebar lifetime, not across restarts.

## Settings (src/settings/settings.ts)

```typescript
export interface VoiceEditSettings {
  provider: 'mistral'
  mistralApiKey: string
  editModel: string
  skillsPath: string
}

export const DEFAULT_SETTINGS: VoiceEditSettings = {
  provider: 'mistral',
  mistralApiKey: '',
  editModel: 'mistral-medium-latest',
  skillsPath: '0 - Meta/Skills',
}
```

The provider field is a single-member union now; Desktop V1 widens it (FR26).

An empty skillsPath disables discovery, giving a user without vault skills the same prompt and the same startup cost (FR38).

### Skill

```typescript
export class Skill {
  constructor(
    readonly name: string,
    readonly description: string,
    readonly path: string,
  ) {}
}
```

Descriptions are held, bodies are not. SkillRepository lists them at the start of each turn and carries only what the prompt lists (NFR6). A body is read on demand, for the one skill an utterance matched.

## Mistral Endpoints (src/providers/mistral-provider.ts)

- Transcription: POST https://api.mistral.ai/v1/audio/transcriptions, multipart with file and model voxtral-mini-latest. Response field text.
- Chat: POST https://api.mistral.ai/v1/chat/completions with tools and tool_choice auto. Map tool_calls to ToolCall, content to text.
- Both authenticated with Authorization: Bearer key. Non-2xx maps to a failed Outcome carrying status and body snippet.
