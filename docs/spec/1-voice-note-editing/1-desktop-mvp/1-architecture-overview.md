# Desktop MVP: Architecture Overview

Implements [high-level-design/1-desktop-mvp.md](../high-level-design/1-desktop-mvp.md). This folder is the implementable spec: an agent should build the release from these files without further decisions.

The tree below is the finished shape. Every path exists except `src/skills/`, which [6-implementation-order.md](6-implementation-order.md) covers.

## Source Tree

```
obsidian-voice-edit/
  manifest.json
  esbuild.config.mjs
  package.json
  tsconfig.json
  styles.css
  src/
    main.ts                  VoiceEditPlugin: lifecycle, view + command registration
    session/
      edit-session.ts        EditSession: bound file, history, operation log
      session-view.tsx       SessionView: sidebar ItemView hosting a React root
      SessionPanel.tsx       React component: history list, mic button, input row
      HistoryList.tsx        React component: the scrolling turn entries
      panel-state.ts         SessionPanel reducer and state machine
      note-access.ts         WorkspaceNoteAccess: opens the bound note for a turn
      rebind-modal.ts        RebindModal: keep-or-restart prompt on a new file
    capture/
      recorder.ts            Recorder: MediaRecorder wrapper, one utterance per cycle
    providers/
      types.ts               TranscriptionProvider, ChatProvider, message and tool types
      mistral-provider.ts    MistralProvider: both interfaces against api.mistral.ai
      mistral-mapping.ts     Request and response mapping for the Mistral wire format
    engine/
      edit-engine.ts         EditEngine: tool loop orchestration
      edit-applier.ts        EditApplier: anchor resolution and editor mutations
      operation-parser.ts    OperationParser: tool call arguments to EditOperation
      text-positions.ts      Offset to EditorPosition conversion
      tool-schemas.ts        Tool JSON schemas and the system prompt builder
      outcome.ts             Outcome type
    skills/
      skill-loader.ts        SkillLoader: adapter access, enumerate and read SKILL.md
      skill-frontmatter.ts   Parse name and description out of a skill file
      skill-catalogue.ts     SkillCatalogue: discovered skills for a session
    settings/
      settings.ts            Settings interface and defaults
      settings-tab.tsx       PluginSettingTab hosting a React root
      SettingsPanel.tsx      React component: provider key and model fields
  src/test-support/          Builders and the obsidian mock (__mocks__/obsidian.ts)
```

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
- manifest.json: id obsidian-voice-edit, minAppVersion 1.5.0, isDesktopOnly true for this release.

Outstanding work lives in [6-implementation-order.md](6-implementation-order.md); the shared contracts it depends on are in [2-data-model.md](2-data-model.md).
