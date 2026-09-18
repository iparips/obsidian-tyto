---
created: 2026-09-18
updated: 2026-09-18
---

# The Provider Boundary

Neither direction of MistralMapper (Model Providers) has a unit test today, so both sides of the drop are currently unguarded.

## MistralMapper.toChatTurn

```text
tool_calls present and content present -> ofToolCalls(calls, content)
tool_calls present and content absent  -> ofToolCalls(calls, '')
tool_calls empty or absent             -> ofText(content ?? '')
```

```text
the reply carries tool calls
  keeps the text alongside the calls, so a sentence the model spoke is not lost
  holds the calls when the reply carried no text
  reads as tool calls rather than text, so the turn does not end on it
the reply carries text only
  holds the text and no calls
  holds an empty text when content is null, rather than the string null
the reply carries neither
  holds an empty text, so the turn ends rather than looping on nothing
```

## MistralMapper.toApiMessage

Kept symmetric with toChatTurn on purpose: a text carried in and stripped out is the same defect from the other side.

```text
message has tool calls   -> { role: assistant, content: message.content, tool_calls }
message is a tool result -> { role: tool, tool_call_id, content }
otherwise                -> { role: apiRole(), content }
```

```text
an assistant message carrying tool calls
  sends the content back, so the model reads its own last reply in full
  sends an empty content when the message carried none
  sends every tool call, with its arguments serialised
a tool result message
  sends the call id it answers, so the provider pairs it with its call
an ordinary assistant or user message
  sends its role and content unchanged
```

## ChatTurn.ofToolCalls

```text
ofToolCalls(calls, content = '') -> a turn of kind toolCalls holding both
```

```text
called with calls and text
  holds both, so a reply carrying a sentence and a batch loses neither
  still reads as tool calls, so ConversationTurnRunner runs them rather than ending the turn
called with calls alone
  holds an empty content, which is what every existing call site means
```

## StoredMessages.assistant

One line, and the reason it is one line: StoredMessages.of (Session Models) already persists content for every message, so nothing about the stored shape moves.

```text
stored has tool calls -> modelToolCalls(calls, stored.content)
stored has none       -> model(stored.content)
```

```text
a stored assistant message with tool calls
  reads the content back, so a restored session holds what the model said
  reads back with empty content when the record was written before this change
  reads every tool call back with its arguments
a stored assistant message with no tool calls
  reads back as a plain model message, unchanged
```

SESSION_SNAPSHOT_VERSION does not move, and the second case is what pins that. A record written before this carries an empty content, which is exactly today's behaviour.
