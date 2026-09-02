# Working On This Repo With An Agent

Repo-specific conventions for AI coding agents. Human setup and build commands
are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Code Conventions

Full rules live in the author's global config. The ones that bite most often:

- Files under 100 lines of code, excluding comments.
- Functions under 15 lines, one purpose each, one level of branching.
- One class per file. Prefer classes with static methods over free functions.
- Higher-order functions sit above the lower-order ones they call.
- Australian English in code, comments, and docs.
- End every file with a newline.

## Services And Value Objects

The codebase splits every type into one of two kinds, and the name tells you
which.

- A service reads state and applies operations. It is stateless, so one instance
  serves every turn and is injected once at construction. It takes what it needs
  as parameters. Named after a verb: NoteEditor, PromptBuilder, SkillRepository.
- A value object represents state. Fields are readonly, and a change returns a
  new instance. Named after a noun: NoteContext, AgentSession, Skill.

Two rules catch most mistakes:

- A value object never exposes a service, so nothing reaches through a value to
  find behaviour.
- A service never holds the state it operates on. A service you find yourself
  rebuilding per turn is a value object wearing the wrong hat.

Prefer a class over an interface for data this codebase builds itself. Keep an
interface for behaviour contracts with a test fake, React props, and anything
crossing JSON: a class instance does not survive that round trip.

## Package Layout

Services sit in the package root. Three subfolders hold the rest:

- models/ for value objects
- views/ for React components and Obsidian view classes
- tests/ for the package's tests

A package with a single value object keeps it in the root; a folder holding one
file costs more than it saves. Session is the UI package and owns no engine
types. Dependencies point one way with no cycles, and
[architecture/7-package-design.md](architecture/7-package-design.md)
holds the direction and the per-package counts. Outcome lives in shared, which
depends on nothing.

## Tests

- Vitest, in a tests/ folder beside the code under test. Vitest matches on
  filename, not directory, so the folder needs no configuration.
- Name tests "does X when Y". Never start a name with "should".
- Nest describe blocks by execution context, not by method name.
- Arrange-Act-Assert, with blank lines between the three sections.
- One branch per test case, so a broken branch fails exactly one test.
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

The system prompt is assembled in src/engine/prompt-builder.ts. Editing it
changes what the model does, and the unit tests cannot catch a regression there.
Test a prompt change against a real vault and a real API key.

One prompt rule is load-bearing: a vault with no skills must produce the same
prompt as before vault skills existed, byte for byte. Verify against git rather
than by eye:

```bash
git show <ref>:src/engine/prompt-builder.ts > /tmp/old.ts
# build both, compare PromptBuilder.build() output for an empty catalogue
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
