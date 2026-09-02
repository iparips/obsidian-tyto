# Obsidian Agent Harness: Data Model

New types, written first so the packages can be built in parallel against them.
Delta on [1-desktop-mvp/2-data-model.md](../../1-desktop-mvp/3-data-model.md).

## Commands (src/commands/models/)

```typescript
// allowed-command.ts - one entry in the resolved catalogue
export class AllowedCommand {
  constructor(
    readonly id: string,
    readonly name: string,
  ) {}
}

// command-effect.ts - what a run changed, as far as the harness can tell
export class CommandEffect {
  private constructor(
    readonly commandName: string,
    readonly openedPath: string | null,
  ) {}

  static opened(commandName: string, path: string): CommandEffect {
    return new CommandEffect(commandName, path)
  }

  static openedNothing(commandName: string): CommandEffect {
    return new CommandEffect(commandName, null)
  }

  rebinds(): boolean {
    return this.openedPath !== null
  }

  // The tool result the model reads. States the binding move in words,
  // because a silent rebind leaves the next anchor pointing at the wrong note.
  describe(): string {
    return this.openedPath
      ? `ran ${this.commandName}; the session is now editing ${this.openedPath}`
      : `ran ${this.commandName}; no note opened, still editing the same note`
  }
}
```

## Search (src/search/models/)

```typescript
// search-hit.ts - one scored match, already trimmed to an excerpt
export class SearchHit {
  constructor(
    readonly path: string,
    readonly score: number,
    readonly excerpt: string,
  ) {}
}
```

## Settings (src/settings/settings.ts)

Two fields are added. `commandAllowList` holds what the user typed, never what
it resolves to (FR3).

```typescript
export interface OwlSettings {
  provider: 'mistral'
  mistralApiKey: string
  editModel: string
  skillsPath: string
  commandAllowList: string[] // ids and namespace patterns
  searchEnabled: boolean
}

export const DEFAULT_SETTINGS: OwlSettings = {
  provider: 'mistral',
  mistralApiKey: '',
  editModel: 'mistral-medium-latest',
  skillsPath: '0 - Meta/Skills',
  commandAllowList: ['daily-notes:*'],
  searchEnabled: true,
}
```

The default allow-list holds the one namespace that is note-opening by
construction across every vault (FR5). Anything vault-specific, including the
open-or-create commands, is the user's to add: the plugin cannot know which of
their commands open notes without running them.

Rename note: the interface was `VoiceEditSettings`, missed by the rename to Owl.
It is `OwlSettings` now, along with `OwlPlugin` and `OwlSettingsTab`.

## Session state

State changes go through a repository, split by how long the state lives.
AgentSession (Engine) is gone: its chat history moved to SessionRepository, and
its operation history was dropped, since Obsidian owns undo (NFR5) and the
journal release 7 needs is a different shape.

```typescript
// src/session/session-repository.ts - what survives every turn
export class SessionRepository {
  targetNote(): string
  changeTargetNote(path: string): void
  resetTargetNoteToOriginal(): void // FR20
  chatHistory(): readonly ChatMessage[]
  appendChatMessage(message: ChatMessage): void
}

// src/engine/turn-repository.ts - what one turn holds, discarded with it
export class TurnRepository {
  targetNote(): OpenNote
  agentMdChain(): AgentsMdChain
  skills(): readonly Skill[]
  skillNamed(name: string): Skill | undefined
  editEnd(): EditorPosition | null
  retargetTo(resolved: ResolvedNote): void
  recordEdit(editedTo: EditorPosition | undefined): void
}
```

The session holds a path; the turn holds the editor found for it. An editor
handle kept across turns goes stale silently when the user closes the tab,
whereas a path re-resolves and fails loudly, which is the failure the release
wants.

## Panel entries (src/session/models/panel-state.ts)

Two entry kinds are added to the existing union (FR16, FR28).

```typescript
export type Entry =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'error'; step: FailureStep; text: string }
  | { kind: 'instructions'; text: string }
  | { kind: 'command'; text: string } // "ran Todo; now editing ..."
  | { kind: 'answer'; text: string; sources: string[] }
```

`answer` carries its sources as a separate field rather than folded into the
text, so the panel can render them apart from the copyable body and the user
can see at a glance how many notes an answer drew on.

Matching actions join `PanelAction`: `{ type: 'commandRan'; text: string }` and
`{ type: 'answer'; text: string; sources: string[] }`.

## Tool schemas (src/engine/models/tool-schemas.ts)

Four tools are added to `TOOL_SCHEMAS`, and `ToolCall` gains predicates beside
`isLoadSkill`.

```typescript
export const RUN_COMMAND = 'run_command'
export const SEARCH_VAULT = 'search_vault'
export const READ_NOTE = 'read_note'
export const ANSWER_FROM_SEARCH = 'answer_from_search'
```

- `run_command` takes `command_id`. Returns `CommandEffect.describe()`.
- `search_vault` takes `query` and optional `modified_within_days`. Returns
  the hits as path, score and excerpt lines.
- `read_note` takes `path`. Returns the note in full.
- `answer_from_search` takes `answer` and `sources` (a path array). Returns
  confirmation that the answer reached the panel.

`answer_from_search` is a tool rather than plain text so the sources arrive
structured (FR27). A text reply would make the panel parse prose for paths.
