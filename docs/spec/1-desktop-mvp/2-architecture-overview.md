# Desktop MVP: Architecture Overview

Implements [architecture/1-desktop-mvp.md](../../architecture/1-desktop-mvp.md). This folder is the implementable spec: an agent should build the release from these files without further decisions.

The tree below is the finished shape. Every path exists except `src/skills/`, which [7-implementation-order.md](7-implementation-order.md) covers. Package ownership and the dependency rule: [architecture/7-package-design.md](../../architecture/7-package-design.md).

## Source Tree

```
obsidian-owl/
  manifest.json
  esbuild.config.mjs
  package.json
  tsconfig.json
  styles.css
  src/
    main.ts                  VoiceEditPlugin: lifecycle, view + command registration
    session/
      models/
        panel-state.ts       SessionPanel reducer and state machine
      views/
        session-view.tsx     SessionView: sidebar ItemView hosting a React root
        SessionPanel.tsx     React component: history list, mic button, input row
        HistoryList.tsx      React component: the scrolling turn entries
        HistoryEntry.tsx     React component: one entry with its copy button
        rebind-modal.ts      RebindModal: keep-or-restart prompt on a new file
    capture/
      recorder.ts            Recorder: MediaRecorder wrapper, one utterance per cycle
    providers/
      types.ts               TranscriptionProvider, ChatProvider, ToolSchema
      mistral-provider.ts    MistralProvider: both interfaces against api.mistral.ai
      mistral-mapper.ts      MistralMapper: map to and from the Mistral wire format
      models/
        chat-message.ts      ChatMessage: one message in the conversation
        chat-turn.ts         ChatTurn: tool calls or text from one model response
        tool-call.ts         ToolCall: one tool call the model asked for
    engine/
      edit-engine.ts         EditEngine: agent loop orchestration
      note-editor.ts         NoteEditor: anchor resolution and editor mutations, stateless
      workspace-note-locator.ts  WorkspaceNoteLocator: finds the editor holding the bound note
      note-operation-parser.ts  NoteOperationParser: tool call arguments to EditOperation
      position-converter.ts  PositionConverter: offset to EditorPosition conversion
      prompt-builder.ts      PromptBuilder: assembles the system prompt
      rule-builder.ts        RuleBuilder: the role and dictation rule text
      models/
        note-context.ts      NoteContext: path, content and cursor for one model call
        agent-session.ts     AgentSession: bound file, chat history, operation history
        open-note.ts         OpenNote: the editor handle, path and cursor for a turn
        tool-schemas.ts      TOOL_SCHEMAS: the JSON schemas sent to the model
    skills/
      skill-repository.ts    SkillRepository: list skill descriptions, read one body
      skill-frontmatter.ts   Parse name and description out of a skill file
      skill.ts               Skill: name, description and path of one skill
    settings/
      settings.ts            Settings interface and defaults
      settings-tab.tsx       PluginSettingTab hosting a React root
      SettingsPanel.tsx      React component: provider key and model fields
    shared/
      models/
        outcome.ts           Outcome: success or failure with a step, depends on nothing
  src/test-support/          Builders and the obsidian mock (__mocks__/obsidian.ts)
```

Services sit in the package root; value objects go in models/, rendering code in
views/, and tests in tests/. [architecture/7-package-design.md](../../architecture/7-package-design.md)
holds the rule and the per-package counts.

## Rules

- One class per file, files under 100 lines of code.
- Dependency direction follows the module map: UI depends on Capture, Engine and Providers; Engine depends on Providers and Skills; nothing depends on UI.
- Skills depends only on the Obsidian adapter, so a fake adapter drives it in tests.
- Lower layers return Outcome objects; SessionPanel is the only layer that renders errors.
- Runtime dependencies: react and react-dom only. Fetch and MediaRecorder are platform globals.

## Tech Stack

Matches the conventions of the author's other Obsidian plugins.

- Bun as runtime and bundler: bun build src/main.ts, cjs format, obsidian external, sourcemap.
- React 19 for the session panel and settings UI, mounted from ItemView and PluginSettingTab shells.
- Vitest with happy-dom and testing-library; obsidian aliased to src/test-support/**mocks**/obsidian.ts in vite config.
- eslint and prettier; build script runs test, lint, format, then bundle.
- manifest.json: id obsidian-owl, minAppVersion 1.5.0, isDesktopOnly true for this release.

Outstanding work lives in [7-implementation-order.md](7-implementation-order.md); the shared contracts it depends on are in [3-data-model.md](3-data-model.md).
