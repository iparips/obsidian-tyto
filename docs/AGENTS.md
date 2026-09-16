# Repo Conventions

Repo-specific conventions for AI coding agents. Branching rules are in the root
[AGENTS.md](../AGENTS.md); human setup and build commands are in
[CONTRIBUTING.md](CONTRIBUTING.md).

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

The code-generation skill owns how a tree grows: group by subdomain, and give a
subdomain kind folders only once it outgrows the file limit. This file holds
what this repo decided.

- Engine splits into six concept folders: turn, tools, skill-gating, waiting,
  note-editing, note-binding. The root holds only what spans them: EditEngine,
  ToolDispatcher, TurnProgressPublisher, TurnStep, TurnEndingService,
  UtteranceQueue.
- Construction knowledge lives in wiring, and only there: a file may construct a
  class from another package only if its path starts with src/wiring. Everything
  else codes against what the package already exposes. test-support is the one
  case still open.
- Model holds everything about talking to the provider: the request, prompt/
  and providers/. PromptFactory is prompt/'s entry point and the one class that
  turns a request into messages; under it, one class per message, and
  system-prompt-sections/ holds one per section of the system prompt. Each
  section owns its own text and decides whether it appears.
- The placement test for tools/: it takes a ToolCall and returns a result.
  NoteEditor takes an EditOperation, so it lives in note-editing.
- Smaller packages keep a models/ folder for value objects, so skills keeps
  skill.ts beside skill-repository.ts rather than alone in one.
- Anything that renders lives under views/, in every package that renders.
  Nothing outside a views/ folder imports React. Both rules are greppable, which
  is why they are written this way rather than as a judgement call.
- views/ holds the React components, views/hooks/ the subscription hooks, and
  views/obsidian/ what extends an Obsidian class rather than rendering React. A
  component holds what it decides; subscriptions that only dispatch go in a hook
  that declares its own ports interface, as useEngineEvents does.
- tests/ holds the package's tests, beside the code under test. A views/ folder
  keeps its own views/tests/.

Session is the UI package. Dependencies point one way apart from two open
cycles, model to engine and engine to session, and
[architecture/7-package-design.md](architecture/7-package-design.md)
holds the direction, the cycles and the per-package counts. Outcome lives in
shared, which depends on nothing.

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
  change. Keep that reformatting and commit it on its own, as a whitespace
  commit separate from the change you were making.
- It writes main.js at the repo root. That file is generated, not source.

## Prompt Changes Are Behaviour Changes

The system prompt is assembled in src/model/prompt/system-prompt.ts from the
sections beside it. Editing any of them changes what the model does, and the
unit tests cannot catch a regression in judgement. Test a prompt change against
a real vault and a real API key.

One prompt rule is load-bearing: a vault with no commands, no search and no
skills must produce the release 3 prompt byte for byte. That one is guarded by a
fixture, so the suite does catch it:

```
src/model/prompt/tests/fixtures/release-3-prompt.txt
```

A change that moves prompt text between files should leave that test green. A
change that alters what the model is told will not, and the fixture is then the
thing to re-record deliberately rather than to work around.

## Skill Files Are Untrusted

Vault skills are user content that reaches the model as instructions. A skill
cannot widen what the plugin can do: tools come from TOOL_SCHEMAS, and a skill
naming anything outside that list finds nothing to call. Keep it that way.

Never let a skill file name a tool, an API endpoint, or a path outside the vault
that the plugin then acts on.

## Specs

Specs live under docs/spec, one folder per feature, in three buckets by state.
A feature folder holds requirements, then design, then tasks. Read the spec
before changing behaviour it describes, and update it when the behaviour moves.

| Bucket     | Holds                         | Numbered |
| ---------- | ----------------------------- | -------- |
| 1-upcoming | Designed, no code in the tree | No       |
| 2-active   | Being built now               | No       |
| 3-archived | Built and shipped             | Yes      |

A spec takes its number on the way into 3-archived, not on the way into
1-upcoming. The number is chronological and permanent: commit messages and the
architecture docs cite it, so a shipped spec keeps it even once superseded.
Numbering unbuilt work instead forces a renumber every time something ships out
of order.
