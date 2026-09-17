# Working On This Repo With An Agent

Tyto is an Obsidian-native model harness for editing notes by voice. It gives a
model the tools to read the vault, run Obsidian commands and write to a note,
and runs a turn per spoken utterance: one instruction, a loop of model calls,
and the edits that loop applies to the note the turn is targeting.

## Branching

Work on `main`. Do not create a feature branch, and do not use a git worktree.

Commit directly to `main` as you go. Ilya chooses the grouping and the message,
so leave finished work in the tree and say what is ready to commit rather than
committing unasked.

Never push, force-push, or merge without being asked.

## Where Things Are

- [docs/architecture/0-index.md](docs/architecture/0-index.md) - the architecture docs, indexed
- [docs/architecture/12-the-panel-vocabulary.md](docs/architecture/12-the-panel-vocabulary.md) - read before naming anything a turn, a turn step or a progress line; the three are easily confused
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) - setup and build, for a person rather than an agent
- [README.md](README.md) - what the plugin does and does not do, and why

## Skill Inputs

Values a skill resolves rather than hardcodes. A row here beats the same row in
the user-level AGENTS.md, since this repo is the thing being described.

| Skill | Variable                  | Value                            |
| ----- | ------------------------- | -------------------------------- |
| sdd   | work_dir                  | docs/spec                        |
| sdd   | sdd.work_lifecycle_stages | 1-upcoming, 2-active, 3-archived |

No categories row, so a spec folder sits directly under a stage. The stages run
in that order: designed but unbuilt, being built now, then shipped. Read a spec
before changing behaviour it describes, and update it when the behaviour moves.

The sdd skill owns how a spec folder is named. One thing it cannot know: the
numbered folders already in 3-archived stay numbered, because fifteen have no
recoverable date and their numbers record the real shipping order.

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

[docs/architecture/7-package-design.md](docs/architecture/7-package-design.md)
owns it: what each package holds, which way dependencies run, the two open
cycles, and the layout within a package. Read it before adding a file.

Two rules from it are worth stating here, because both are checkable by reading
a path and both are easy to break by accident.

- A file may construct a class from another package only if its path starts with
  src/wiring. Everything else codes against what the package already exposes.
- Nothing outside a views/ folder imports React.

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
