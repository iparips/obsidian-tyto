---
created: 2026-09-18
updated: 2026-09-18
---

# Design: Behaviour Change And Sequence

What moves, and the one flow that carries both new endings. Part of [1-index.md](1-index.md).

## Behaviour change

| Concern                          | Today                                                  | New                                                              |
| -------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| Matches shown per matched note   | One excerpt, from the first match                      | Every match, merged where windows touch                          |
| Excerpt width                    | Fixed 200 characters                                   | context_lines, default 3, capped 15 per match                    |
| Excerpt unit                     | Character offsets                                      | Line ranges, stated in the row                                    |
| MAX_HITS                         | 10, sized for a 200-character row                      | 6, sized for a block                                              |
| MAX_PATHS                        | 50                                                     | Unchanged: a paths-only row is still a path                       |
| A grep row                       | One line, path and count and excerpt                   | A block: path and count, then each excerpt with its line range   |
| Two searches finding nothing     | Counts for nothing; the turn runs to its step ceiling  | Ends the turn, named as found-nothing                            |
| A context overflow               | API responded 400 plus a 200-character snippet         | Named as overflow, with what was read and a continuation prompt  |
| TurnEndingKind                   | Five values                                            | Seven: FoundNothing and Overflowed join them                     |
| Prompt, search on                | No transcription, read-first or question-route rule    | Four rules added across two sections                             |
| Prompt, search off               | Carries the duplicated checkbox line                   | Duplicate deleted, transcription rule added                      |
| release-3-prompt.txt             | 33 lines                                               | 33 lines: one deleted, one added                                 |

## Behaviour sequence

```mermaid
sequenceDiagram
    participant Runner as ConversationTurnRunner [Engine Turn]
    participant Model as ModelService [Engine Turn]
    participant Provider as MistralProvider [Model Providers]
    participant Executor as ToolCallExecutor [Engine Turn]
    participant Search as SearchToolsService [Engine Tools]
    participant Grep as NoteGrep [Search]
    participant Excerpts as NoteExcerpts [Search, new]
    participant Report as SearchReport [Search]
    participant Spend as TurnSpend [Engine Turn Spending]
    participant Ending as TurnEndingService [Engine]

    Runner->>Model: askModel
    Model->>Provider: complete

    alt "the model call overflowed"
        Provider-->>Model: Failure carrying CONTEXT_OVERFLOW [new]
        Runner->>Ending: endTurnAsUnfinished
        Note over Ending: reads the utterance and the notes read, both turn-scoped
        Note over Ending: never the session-scoped paths, which hold earlier turns
        Ending-->>Runner: EndedTurn of Overflowed [new]
    else "the model asked for a grep"
        Provider-->>Model: ChatTurn of tool calls
        Runner->>Executor: executeToolCalls
        Executor->>Search: grep
        Search->>Grep: find
        Grep->>Excerpts: buildExcerpts [new]
        Note over Excerpts: every match, windows merged where they touch
        Excerpts-->>Grep: NoteExcerpt list [new]
        Grep-->>Search: GrepResult
        Search->>Report: ofGrep
        Note over Report: a block per hit, each excerpt naming its line range
        Report-->>Search: report text
        Search-->>Executor: TextResult carrying foundNothing [new]
        Executor->>Spend: record against emptySearchCounter [new]
        Runner->>Spend: isStuck

        alt "the guard fired"
        Note over Runner,Spend: two searches in a row found nothing
            Runner->>Ending: end as FoundNothing [new]
            Note over Runner: the prompt announced this, so the ending is predictable
        else "the search found something"
            Note over Runner: the loop runs another turn step
        end
    end
```

Arrows: uses-relationship (client to supplier).

