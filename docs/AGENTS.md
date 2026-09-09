# Working On This Repo With An Agent

Repo-specific conventions for AI coding agents. Human setup and build commands
are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Code Conventions

The code-generation and code-unit-tests skills own the general rules: size
limits, naming, blocks and state, test shape. This file holds only what is
specific to this repo.

- A repository is any holder of state across calls, and its package states
  the scope. Everything under engine/turn dies with the turn; the
  session-scoped PathsReturnedByVaultRepository lives in TurnRunnerFactory.
- Anything about commands carries the Obsidian prefix once it leaves
  commands/. A value read by both the model and the panel has
  descriptionForModel and descriptionForUser.

## Package Layout

Files group by concept, not by kind. A value object sits beside the service
that reads it, so the folder explains both.

- Engine splits into six concept folders: turn, tools, waiting, note-editing,
  note-binding, prompting. The root holds only what spans them: EditEngine,
  EngineFactory, ToolDispatcher, TurnProgressPublisher, TurnStep, ModelCaller,
  TurnEndingService, UtteranceQueue.
- The placement test for tools/: it takes a ToolCall and returns a result.
  NoteEditor takes an EditOperation, so it lives in note-editing.
- Smaller packages keep a models/ folder for value objects. A package with a
  single value object keeps it in the root; a folder holding one file costs
  more than it saves.
- views/ holds React components and Obsidian view classes. A component holds
  what it decides; subscriptions that only dispatch go in a hook that declares
  its own ports interface, as useEngineEvents does.
- tests/ holds the package's tests.

Session is the UI package. Dependencies point one way with no cycles, and
[architecture/7-package-design.md](architecture/7-package-design.md)
holds the direction and the per-package counts. Outcome lives in shared, which
depends on nothing.

## Tests

- Vitest, in a tests/ folder beside the code under test. Vitest matches on
  filename, not directory, so the folder needs no configuration.
- Use the helpers in src/test-support rather than writing new fakes.

## Build

```bash
bun run test     # unit suite
bun run build    # test, lint, format, then bundle
```

Two things to know about `bun run build`:

- It runs prettier over the whole repo, so it reformats files unrelated to your
  change. Revert that churn before handing work back.
- It writes main.js at the repo root. That file is generated, not source.

## Prompt Changes Are Behaviour Changes

The system prompt is assembled in src/engine/prompt-factory.ts. Editing it
changes what the model does, and the unit tests cannot catch a regression there.
Test a prompt change against a real vault and a real API key.

One prompt rule is load-bearing: a vault with no skills must produce the same
prompt as before vault skills existed, byte for byte. Verify against git rather
than by eye:

```bash
git show <ref>:src/engine/prompt-factory.ts > /tmp/old.ts
# build both, compare PromptFactory.build() output for an empty catalogue
```

## Skill Files Are Untrusted

Vault skills are user content that reaches the model as instructions. A skill
cannot widen what the plugin can do: tools come from TOOL_SCHEMAS, and a skill
naming anything outside that list finds nothing to call. Keep it that way.

Never let a skill file name a tool, an API endpoint, or a path outside the vault
that the plugin then acts on.

## Specs

Specs live under docs/spec, one folder per feature, numbered chronologically.
A feature folder holds requirements, then design, then tasks. Read the spec
before changing behaviour it describes, and update it when the behaviour moves.
