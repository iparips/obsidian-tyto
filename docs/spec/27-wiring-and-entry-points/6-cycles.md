---
created: 2026-09-14
updated: 2026-09-14
---

# The Two Cycles

Two package cycles the survey turned up. Neither is closed by this spec: the
wiring move removes two construction sites and nothing else. They are recorded
here so the specs that do close them start from measured surfaces.

```mermaid
flowchart LR
    E["engine [Engine]"]
    S["session [Session]"]
    M["model [Model]"]

    E -->|"2: SessionRepository, TranscriptRepository"| S
    S -->|"10: EditEngine, turn state, waiting"| E
    M -->|"2: OpenNote, NoteDetails"| E
    E -->|"7: ModelRequest, provider, dates"| M
```

Arrows: uses-relationship (client to supplier).

The model cycle is documented in
[architecture/7-package-design.md](../../architecture/7-package-design.md). The
session cycle is not: that doc records session depending on engine, and engine
on session for nothing.

### model and engine: two values lent upward

OpenNote holds an editor, a path and a cursor. NoteDetails is a snapshot of the
same. Neither holds a service, and both are what a prompt is made of, so a value
package below both closes the cycle with a move and nothing else.

```mermaid
flowchart LR
    subgraph Before["Before"]
        E1["engine [Engine]"]
        M1["model [Model]"]
        E1 -->|7| M1
        M1 -->|"2: values"| E1
    end

    subgraph After["After"]
        E2["engine [Engine]"]
        M2["model [Model]"]
        N2["note-context [Note Context, new]<br/>OpenNote, NoteDetails"]
        E2 -->|7| M2
        E2 --> N2
        M2 --> N2
    end
```

Arrows: uses-relationship (client to supplier).

### engine and session: two repositories, two different problems

The surfaces say these are not the same case.

| Repository        | Engine calls                                                 | Session calls                                                         | Overlap      |
| ----------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- | ------------ |
| SessionRepository | targetNote, chatHistory, appendChatMessage, changeTargetNote | targetNote, chatHistory, appendChatMessage, isBound, changeTargetNote | Almost total |
| Transcript        | recordCall, recordEnding, recordedEndings                    | recordedSteps, recordedParts, panelStepPublished, isEmpty, hasFailed  | Nearly none  |

SessionRepository holds the target note and the chat history, which is what a
turn runs on rather than what a panel owns. It sits in session by history. A
package below both ends that half of the cycle.

TranscriptRepository splits by direction instead: engine writes, session reads.
That is a port, declared by engine and implemented by session's existing class.

```mermaid
flowchart LR
    subgraph Now["Now"]
        E1["engine [Engine]"]
        S1["session [Session]"]
        E1 -->|"SessionRepository"| S1
        E1 -->|"TranscriptRepository"| S1
        S1 -->|10| E1
    end

    subgraph Fixed["Fixed"]
        E2["engine [Engine]<br/>declares the recorder port"]
        S2["session [Session]<br/>TranscriptRepository implements it"]
        T2["turn-state [Turn State, new]<br/>SessionRepository"]
        W2["wiring [Wiring, new]"]
        E2 --> T2
        S2 --> T2
        S2 --> E2
        W2 --> E2
        W2 --> S2
    end
```

Arrows: uses-relationship (client to supplier).

Moving SessionRepository is a larger claim than it looks: eleven files name it,
and if it is turn state then its name is wrong. That rename is the one part of
this needing a decision rather than a move.

### Where the twelve imports sit

| Site                              | Uses                          | Constructs |
| --------------------------------- | ----------------------------- | ---------- |
| engine-factory                    | SessionRepository, Transcript | Yes        |
| turn/turn-runner-factory          | SessionRepository, Transcript | Yes        |
| edit-engine                       | SessionRepository             | No         |
| tool-dispatcher                   | SessionRepository             | No         |
| turn-ending-service               | SessionRepository             | No         |
| note-binding/target-note-resolver | SessionRepository             | No         |
| turn/model-service                | SessionRepository, Transcript | No         |
| turn/tool-call-executor           | SessionRepository             | No         |
| turn/conversation-turn-runner     | TranscriptRepository          | No         |

Moving wiring out fixes the two that construct. The other ten take the
repositories as collaborator types, and no wiring arrangement touches those.

Closing the rest is a design change rather than a move, so it belongs in its own
spec. The order that works: the note-context move first, since it needs no
decision; wiring next, which this spec builds; then turn-state and the recorder
port.
