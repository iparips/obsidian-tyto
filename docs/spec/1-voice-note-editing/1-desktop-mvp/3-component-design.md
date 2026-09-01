# Desktop MVP: Component Design

Implementation detail for the engine and capture components. UI components are in [4-settings-ui.md](4-settings-ui.md).

## Tool Schemas (src/engine/tool-schemas.ts)

Free functions building the tool schema list and the system prompt; no state. Three tools, matching the EditOperation union in [2-data-model.md](2-data-model.md).

```json
{
  "name": "replace_text",
  "description": "Replace one exact, unique occurrence of anchor_text with replacement.",
  "parameters": {
    "type": "object",
    "properties": {
      "anchor_text": {
        "type": "string",
        "description": "Exact text currently in the note. Must match exactly once. Include enough surrounding text to be unique."
      },
      "replacement": { "type": "string" }
    },
    "required": ["anchor_text", "replacement"]
  }
}
```

insert_text adds position (before/after) instead of replacement; insert_at takes location (note_start/note_end/cursor) and content. Descriptions carry the uniqueness rule verbatim; it is the main lever against bad anchors.

## System Prompt

Built per turn by tool-schemas.ts with four sections.

1. Role and rules: you edit one markdown note via the provided tools; never rewrite the whole note; if the instruction is ambiguous, ask instead of guessing; multi-part instructions become multiple tool calls in order.
2. Dictation rules (FR15-21): classify the utterance as content, instruction, or a mix; clean fillers and self-corrections; format content with markdown - enumerations become lists, spoken cues become headings; content goes to the cursor unless directed elsewhere.
3. Vault skills (FR35-37): one line per discovered skill, name and description, in the shape `name - description`. Omitted entirely when the catalogue is empty, so a vault without skills produces the three-section prompt byte for byte (FR38).
4. Context: the full note content fenced, the cursor line number, and the note path.

The note content is re-read from the editor at the start of every turn, never cached across turns.

### Skill scope rule

The skills section carries the rule that decides FR36 against FR37. `PromptBuilder.skillRules()` (Engine, new) emits it verbatim above the skill list:

```
This vault defines the skills below. When an utterance matches one, follow its
workflow rather than improvising.
Your tools edit the open note and nothing else. Follow a skill only while its
steps stay inside that note.
When a matching skill needs to read or write another file, name the skill, say
that editing other files is not supported yet, and make no partial edit.
```

The model judges this, not the plugin. Skills do not declare a scope, so there is nothing to keep in sync when one is authored or changed. The tool list is the real boundary: no cross-file tool exists, so a skill asking for one finds nothing to call.

## Skills (src/skills/)

```
skill-loader.ts      # adapter access, enumerate and read SKILL.md files
skill-frontmatter.ts # parse name and description out of a skill file
skill-catalogue.ts   # holds discovered skills for a session
```

SkillLoader (Skills, new) takes the Obsidian adapter rather than App, so tests inject a fake without touching the workspace.

Discovery reads `0 - Meta/Skills` through `app.vault.adapter`, listing skill folders and reading each SKILL.md. The path is configurable in settings, defaulting to that value.

### Signature

```typescript
export class SkillLoader {
  constructor(
    private adapter: DataAdapter,
    private skillsPath: string,
  ) {}
  async list(): Promise<SkillCatalogue> {}
}
```

`list()` returns a bare catalogue, not an `Outcome`. Every absent-or-broken case is a defined empty result rather than a failure: a missing folder, an empty configured path, a file without frontmatter, a malformed file (FR38). There is no error for `main.ts` to render, so the Outcome rule in [1-architecture-overview.md](1-architecture-overview.md) does not apply here.

An empty `skillsPath` returns an empty catalogue without touching the adapter, so disabling the feature costs nothing at session start (NFR6).

### Wiring

`VoiceEditPlugin.buildPanelProps()` (Main) becomes async and builds the catalogue once per session, before constructing the engine:

```typescript
const catalogue = await new SkillLoader(this.app.vault.adapter, this.settings.skillsPath).list()
const engine = new EditEngine(provider, session, access, catalogue)
```

`bindOrAskRebind()` and its RebindModal callback await it. `openSession()` is already async, so the change stops there and no caller above it moves.

`EditEngine` takes the catalogue as a fourth constructor parameter, holds it for the session's life, and passes it to the prompt on every turn:

```typescript
PromptBuilder.build(note.context(), this.catalogue)
```

The catalogue is read once at session start, not per turn. Skills change rarely, a re-read costs adapter calls on every utterance, and a session already re-reads the note rather than the vault.

`PromptBuilder.build()` (Engine) gains a second parameter defaulting to an empty catalogue, so existing call sites and tests stay valid.

Two constraints fix the path shape. `app.vault.getFiles()` omits dot-directories, and Obsidian Sync never copies a dot-folder to a phone other than `.obsidian` and `.trash`. So the canonical folder is a normal vault folder, and the harness paths that agents use (`.agents/skills`, `.claude/skills`) are symlinks pointing at it. Symlinks do not reach mobile either, which is why discovery targets the real folder and not a link.

A missing directory throws rather than returning empty. Catch it and produce an empty catalogue (FR38).

### Frontmatter parsing

Skill frontmatter is a leading `---` block with name and description, the description usually a YAML folded scalar spanning several lines. A regex over the block covers these two keys and avoids a YAML dependency for a shape this narrow; note the limitation in code, since anything more structured needs a real parser. A file with no frontmatter, or no name, is skipped rather than failing the turn.

### Trust boundary

A skill body is user content that reaches the model as instructions. It cannot widen capability: tools come from TOOL_SCHEMAS (Engine), and a skill naming something outside them finds no tool. Keep it that way, and never let a skill file name a tool, an API endpoint, or a path outside the vault that the plugin then acts on (NFR7).

## Tool Loop (edit-engine.ts)

```
processUtterance(text):
  push user message onto session history
  loop up to 6 iterations:
    turn = chatProvider.complete(system + history, tools)
    if turn is text: push assistant message, return it as the turn summary
    for each tool call in order:
      op = parse and validate args        -> invalid: tool result "invalid arguments: <why>"
      result = editApplier.apply(op)
      push tool result message ("applied" or the failure reason)
  return failure Outcome: "edit loop exceeded 6 iterations"
```

- Validation failures and apply failures both go back as tool results; the model corrects itself (FR13).
- The iteration cap prevents loops; hitting it is surfaced as a chat-step error.
- A text response is a summary or a clarifying question (FR12); SessionView renders it either way and the next utterance continues the same history.

## Anchor Resolution (edit-applier.ts)

```
apply(op):
  content = editor.getValue()
  matches = indexOfAll(content, op.anchor)
  if matches.length == 0: return noMatch
  if matches.length > 1: return multipleMatches
  editor.replaceRange(...)   convert offset to EditorPosition
  return applied
```

- Matching is exact string equality, no trimming, no fuzz.
- Each operation re-reads the live content, so earlier operations in the same turn shift nothing.
- insertAt cursor uses the cursor position captured when the utterance started, not the live cursor; the user may have tapped elsewhere while the model ran.
- All mutations go through editor.replaceRange, keeping native undo intact (FR22). After the last operation of a turn, the cursor moves to the end of the last edited range and the view scrolls to it (FR25).

## Turn Boundaries

- One utterance is one processUtterance call (per-utterance flush decision).
- The engine is single-flight: a new utterance while a turn runs is queued behind it, never interleaved.

## Recorder (src/capture/recorder.ts)

- getUserMedia audio with the default device; MediaRecorder with audio/webm preferred.
- start() begins a single recording; stop() resolves with the blob and mime type; cancel() discards without resolving.
- Mic permission failure returns a transcription-step Outcome failure.
- Stateless between utterances; each cycle creates a fresh MediaRecorder.
