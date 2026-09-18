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

- [docs/architecture/1-overview.md](docs/architecture/1-overview.md) - the architecture docs, indexed, and the rules that hold across packages
- [docs/architecture/2-vocabulary.md](docs/architecture/2-vocabulary.md) - read before naming anything a turn, a turn step or a progress line; the three are easily confused
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

A new spec goes in 2-active, not in the first stage. The sdd skill defaults to
the first because it cannot know which stage a repo starts work in; here a spec
is written because the work is starting, so 1-upcoming is for the ones Ilya
parks there by asking. Put a spec in 1-upcoming only when he says so.

The sdd skill owns how a spec folder is named, and every folder here follows it:
`YYYY-MM-DD-<slug>`, dated from when the work started. The archive once held
numbered folders instead. Their dates were recovered from git, so the numbers
are gone and nothing is exempt.

Where several specs share a start date, their letters run in the order the work
shipped, which is the order the old numbers recorded.

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

[docs/architecture/1-overview.md](docs/architecture/1-overview.md) owns it:
what each package holds, which way dependencies run, and the two open cycles.
The layout within a package sits in the subsystem file that governs it, so
engine's folders are in 4-the-turn.md. Read the overview before adding a file.

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
bun run verify   # typecheck, test, lint, format, then bundle
bun run build    # bundle to main.js, and nothing else
```

`build` is the bundle alone because the community directory's scan calls it to
rebuild from source and compare against the released main.js. `verify` is the
one to run by hand, and two things are worth knowing about it:

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

## Never Commit A Session Transcript

This is a public repository and the vault it is developed against is a personal
one. A panel transcript is a verbatim copy of real notes: names of real people,
medical and financial errands, reference numbers. Four such files were committed
and pushed before anyone noticed, and removing them meant rewriting history.

Never commit a transcript, a session log, or a pasted note body. That holds
however useful the evidence is, and whatever a spec's prompt asks for.

Where a defect needs evidence, write down the behaviour rather than the content:
the tool calls, what each returned, and the shape of the note. Where an example
needs a name, invent one. `docs/spec/2-active/2026-09-18a-searching-for-a-misheard-name`
is the worked example - it turns on a misheard name and uses Jon and John, which
carry the homophone without carrying anyone real.
