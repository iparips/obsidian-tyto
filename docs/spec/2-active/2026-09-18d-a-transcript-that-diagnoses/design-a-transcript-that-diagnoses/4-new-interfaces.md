---
created: 2026-09-18
updated: 2026-09-18
---

# New Interfaces: The Provider Boundary

The signatures on the model side, which commits one and two build. The transcript side is [5-new-interfaces-transcript.md](5-new-interfaces-transcript.md).

## ChatTurn (Model Providers)

src/model/providers/models/chat-turn.ts. One model response, which may now carry text and calls at once.

The either-or invariant from 5b44191 is relaxed deliberately. The provider permits the pair, and the type forbidding it is what loses the text.

```ts
export class ChatTurn {
  private constructor(
    private readonly kind: 'toolCalls' | 'text',
    readonly calls: ToolCall[],
    readonly content: string,
  )

  // content defaults to empty, so every existing call site keeps its meaning.
  static ofToolCalls(calls: ToolCall[], content?: string): ChatTurn
  static ofText(content: string): ChatTurn

  isToolCalls(): boolean
  isText(): boolean
}
```

## ChatMessage (Model Providers)

src/model/providers/models/chat-message.ts, one changed factory.

```ts
export class ChatMessage {
  // content defaults to empty, which is what every caller but the mapper passes.
  static modelToolCalls(toolCalls: ToolCall[], content?: string): ChatMessage
}
```

## MistralMapper (Model Providers)

src/model/providers/mistral-mapper.ts. Both directions move together, since a text kept on the way in would still be stripped on the way out.

```ts
export class MistralMapper {
  // Carries content alongside tool_calls rather than hardcoding empty.
  static toApiMessage(message: ChatMessage): Record<string, unknown>

  // Carries the content when the reply held both.
  static toChatTurn(message: ApiMessage): ChatTurn
}
```
