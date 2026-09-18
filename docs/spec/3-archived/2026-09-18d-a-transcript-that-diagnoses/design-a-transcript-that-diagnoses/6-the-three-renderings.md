---
created: 2026-09-18
updated: 2026-09-18
---

# The Three Renderings

What the reader actually sees, for each of the three additions that render.

## The Budget Line

One line, first in the response block, on every step. D2 spends the whole per-step allowance here deliberately.

```text
Response from model
- Spend: 3 charged, 7 of 20 used
- tool call grep_notes
```

The two numbers are different kinds, which is why the line names both rather than one.

- charged carries the half a batch draws, and is the number a reader compares against the call list below it
- used is rounded as the counter rounds it, so the last step of an exhausted turn reads 20 of 20 and agrees with the ending message

A step with no charge recorded writes no budget line. That is a step whose provider call failed, there is no number, and inventing one would report a charge the turn never drew.

## An Empty Response Block

Three facts, three wordings, replacing one.

| Slice                                                   | Renders                                             |
| ------------------------------------------------------- | --------------------------------------------------- |
| Empty, and the step drew no charge                      | no reply recorded: the provider call did not return |
| Holds a model message whose content and calls are empty | the model returned an empty reply                   |
| Empty, and the step was charged                         | nothing recorded                                    |

The middle row is a message, not an absence. A reply carrying neither text nor calls reaches the history as an assistant message with an empty content, since MistralMapper.toChatTurn (Model Providers) maps it to ChatTurn.ofText and the turn ends on it.

The third is kept as the honest fallback. It means the harness cannot account for the step, which is a defect in the transcript rather than in the turn, and a reader who sees it should file one.

## A Repeated Call

The mark goes on the call's own line, above the JSON block, so a reader skimming the response blocks sees it without opening anything.

````text
- tool call grep_notes - repeats step 1

  ```json
  {
    "pattern": "jon",
    "applicable_skills": []
  }
  ```
````

The step number is the one a reader sees in the Turn step N heading, which is step + 1.

## What applicable_skills Renders

Nothing changes, and the example above shows why nothing needs to. The declaration is an argument on the call, so TranscriptTurnStep.toolCallLines (Session Transcript) already prints it in the JSON block.

That also keeps the distinction the gate turns on. A declared empty list and an omitted argument are different claims, since the schema makes the argument required and ToolCall.declaresArgument (Model Providers) distinguishes them. The JSON renders the difference exactly: an omitted argument has no key.

## Logging

None. The plugin logs nothing on this path today, the transcript is the record, and a console line would say what the document now says.
