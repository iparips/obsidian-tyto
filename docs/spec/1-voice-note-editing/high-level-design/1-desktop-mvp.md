# Design: Desktop MVP

Covers release 1 of [2-plan.md](../2-plan.md): the full loop on desktop with record-then-transcribe capture. Modules referenced in brackets: UI, Capture, Providers, Engine, plus the external systems Obsidian and Mistral.

## Module Map

```mermaid
flowchart LR
    Main["VoiceEditPlugin [Main]<br/>Responsibility: owns plugin lifecycle by registering views, commands and settings"]
    View["SessionView [UI]<br/>Responsibility: owns the sidebar by rendering history, mic button and text box"]
    Rec["Recorder [Capture]<br/>Responsibility: owns the mic by recording one utterance per start-stop cycle"]
    Prov["MistralProvider [Providers]<br/>Responsibility: owns API access by implementing transcription and chat"]
    Eng["EditEngine [Engine]<br/>Responsibility: owns the model loop by turning an utterance into validated operations"]
    App["NoteEditor [Engine]<br/>Responsibility: owns note mutation by resolving anchors and applying operations"]
    Ed["Editor API [Obsidian]<br/>Responsibility: owns the document by exposing range edits and undo"]
    Skills["SkillRepository [Skills, new]<br/>Responsibility: supplies skills by listing descriptions and reading one body on demand"]
    Adapter["Vault Adapter [Obsidian]<br/>Responsibility: owns raw file access by listing and reading paths the file API omits"]

    Main --> View
    View --> Rec
    View --> Eng
    View -->|"transcribe"| Prov
    Eng -->|"complete"| Prov
    Eng --> App
    Eng --> Skills
    Skills --> Adapter
    App --> Ed
```

Arrows: uses-relationship (client to supplier).

## Provider Interface

- TranscriptionProvider [Providers]: transcribe(audio, language) returns text. MVP implementation posts the recorded blob to Mistral's batch endpoint.
- ChatProvider [Providers]: complete(messages, tools) returns tool calls or text.
- MistralProvider [Providers] implements both. The interfaces are the seam FR26 requires; no second implementation ships in this release.

## Utterance Flow

```mermaid
sequenceDiagram
    participant View as SessionView [UI]
    participant Rec as Recorder [Capture]
    participant Prov as MistralProvider [Providers]
    participant Eng as EditEngine [Engine]
    participant App as NoteEditor [Engine]
    participant Ed as Editor API [Obsidian]

    View->>Rec: start
    View->>Rec: stop
    Rec-->>View: audio blob
    View->>Prov: transcribe
    Prov-->>View: transcript
    View->>Eng: processUtterance

    Note over Eng,App: AGENT LOOP
    Eng->>Prov: complete
    Prov-->>Eng: tool calls
    Eng->>App: apply
    App->>Ed: replaceRange
    App-->>Eng: operation result
    Eng->>Prov: complete
    Prov-->>Eng: final text
    Eng-->>View: turn summary
```

Arrows: uses-relationship (client to supplier).

The loop repeats while the model returns tool calls. A text-only response ends the turn; it is either a summary or a clarifying question, and SessionView renders it in the history either way.

## Services And Value Objects

Two kinds of type, in the Domain-Driven Design sense, and the split is a rule
rather than a habit.

- A service reads state and applies operations. It is stateless, so one instance
  serves every turn and is injected once at construction.
- A value object represents state. It holds values, exposes no service, and
  changes nothing.

Two things follow. A data object never hands out a service, so nothing reaches
through a value to find behaviour. And a service never holds the state it
operates on, so nothing has to be rebuilt per turn to stay correct.

EditEngine is the orchestrator: it reads the note, asks the model, parses the
answer, and applies the result. NoteEditor stays between the engine and the
editor because anchor resolution is real logic with its own tests, not because
it owns anything.

```mermaid
sequenceDiagram
    participant Panel as SessionPanel [UI]
    participant Eng as EditEngine [Engine]
    participant App as NoteEditor [Engine]
    participant Ed as Editor API [Obsidian]
    participant Prov as MistralProvider [Providers]

    loop one turn per utterance
        Panel->>Eng: processUtterance

        Note over Eng,Ed: TURN START - the cursor is read once and kept
        Eng->>Ed: getCursor
        Ed-->>Eng: cursor position

        loop while the model returns tool calls
            Note over Eng,Ed: READ STATE - re-read every iteration
            Eng->>Ed: getValue
            Ed-->>Eng: note content
            Note over Eng,Ed: content and the kept cursor become one NoteContext

            Eng->>Prov: complete
            Note over Eng,Prov: sends the utterance and the NoteContext
            Prov-->>Eng: ChatTurn of tool calls

            Note over Eng,App: PARSE
            Eng->>Eng: parse tool calls into EditOperation

            Note over Eng,App: APPLY OPERATIONS
            Eng->>App: apply
            App->>Ed: replaceRange
            App-->>Eng: ApplyResult
        end

        Note over Eng,Prov: the loop ends when complete returns text
        Eng->>App: focusEdit
        App->>Ed: setCursor
        App->>Ed: scrollIntoView
        Eng-->>Panel: turn summary
    end
```

Arrows: uses-relationship (client to supplier).

What each participant is:

| Type                        | Kind    | Holds                                                  |
| --------------------------- | ------- | ------------------------------------------------------ |
| EditEngine [Engine]         | Service | Nothing per turn. The turn's state lives in locals.    |
| NoteEditor [Engine]         | Service | Nothing. Editor, context and operation are parameters. |
| MistralProvider [Providers] | Service | API key and model name only.                           |
| NoteContext [Engine]        | Data    | Path, content and cursor, read at turn start.          |
| EditOperation [Engine]      | Data    | One parsed edit.                                       |
| ApplyResult [Engine]        | Data    | Whether the edit applied, and where it ended.          |

Three consequences:

- The note is re-read at the top of every iteration, so the copy sent to the
  model reflects the edits the last iteration applied and anything the user
  typed. It rides as the last message, after every stale copy in the history.
- insert_at with location cursor reads the cursor from NoteContext, so a turn
  inserts where the cursor was when the user spoke rather than where earlier
  edits have since pushed it.
- focusEdit takes the position the last ApplyResult reported. The engine carries
  that position through the loop in a local, so NoteEditor needs no memory of
  what it applied.

OpenNote holds the editor handle but exposes no service. The engine passes it to
NoteEditor rather than asking it for one, which is what keeps the value from
becoming a door to behaviour.

## Edit Tools

| Tool         | Arguments                                      | Effect                                 |
| ------------ | ---------------------------------------------- | -------------------------------------- |
| replace_text | anchor_text, replacement                       | Replaces the unique anchor match       |
| insert_text  | anchor_text, position (before/after), content  | Inserts content adjacent to the anchor |
| insert_at    | location (note_start/note_end/cursor), content | Inserts at a fixed location            |

- The system prompt carries the full note content, the cursor position, and the dictation-formatting rules (FR15-21).
- One turn may contain several tool calls (FR14); they apply in order.

## Anchor Resolution

- An anchor must match the note text exactly and uniquely.
- Zero matches or multiple matches fail the operation; the failure is returned to the model as the tool result, and the model retries with a longer anchor or asks the user (FR13).
- Offsets are recomputed after each applied operation, since earlier operations shift positions.

## Conversation State

- AgentSession [Session] holds the bound file, the chat history, and the applied-operation history.
- History is provider-format messages, so follow-ups reuse the same array (FR4).
- The note content is re-read and re-sent each turn; the note may have been edited by hand between utterances.

## Vault Skills

- SkillRepository [Skills, new] reads the configured skills folder through the vault adapter on session start, parsing the name and description out of each SKILL.md (FR34).
- The catalogue holds descriptions, never bodies, so prompt cost scales with skill count rather than skill size (NFR6).
- EditEngine [Engine] lists the catalogue in the system prompt, and omits the section entirely when it is empty, leaving a skill-free vault byte-identical to a build without the feature (FR35, FR38).
- Discovery goes through the adapter rather than `app.vault.getFiles()`, which omits dot-directories. The configured folder is a normal vault folder, since Obsidian Sync copies no dot-folder to mobile and the mobile adapter resolves no symlink (NFR3).
- A missing folder, a file without frontmatter, and a malformed file are all non-events: the first yields an empty catalogue, the others are skipped (FR38).

## Skill Scope

The MVP tools edit the open note and nothing else, so a skill is followable only while its steps stay in that note. Of a typical vault, a todo archiver qualifies; a journal router that creates files at computed paths does not.

The model draws that line, using the descriptions in the prompt and the tools it holds (FR36). When a skill fits the utterance but needs another file, it names the skill, says the capability is not there yet, and makes no partial edit (FR37).

Skills declare no scope of their own. A frontmatter flag would be one more thing to set when authoring a skill and would drift from what the skill actually does, whereas the tool list cannot drift: no cross-file tool exists, so a skill reaching for one finds nothing to call. That makes the tools the real boundary and the model's judgement the explanation the user hears.

Release 6 lifts the limit, at which point the FR37 message narrows to whatever is still unsupported.

## Error Handling

- Each layer returns an Outcome; SessionView is the only place that renders errors, naming the failing step (NFR5).
- A failed transcription leaves the history untouched. A failed operation mid-turn stops the turn; already-applied operations stay, and the summary says what landed.
