---
created: 2026-09-18
updated: 2026-09-18
---

# The Builders

aToolTurn (Test Support) is variadic over calls, so it cannot take an optional trailing text. The call sites reach ChatTurn and ChatMessage through it, so the builders are the blast radius rather than the call sites.

| Route                      | Sites | Of which production |
| -------------------------- | ----- | ------------------- |
| aToolTurn                  | 126   | 0                   |
| ChatMessage.modelToolCalls | 11    | 3                   |

A sibling rather than a changed signature, which leaves all 126 untouched.

```ts
export const aToolTurn = (...calls: ToolCall[]): ChatTurn => ChatTurn.ofToolCalls(calls)

// The reply shape D1 exists for: a sentence alongside the batch.
export const aSpokenToolTurn = (content: string, ...calls: ToolCall[]): ChatTurn =>
  ChatTurn.ofToolCalls(calls, content)
```

The three production sites reaching modelToolCalls are ToolCallExecutor (Engine Turn) at line 30, StoredMessages.assistant (Session Models) at line 66, and the factory itself. Only the first two change, and both are named in the rollout.
