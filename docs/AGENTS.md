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

## Tests

- Vitest, colocated with the code under test.
- Name tests "does X when Y". Never start a name with "should".
- Nest describe blocks by execution context, not by method name.
- Arrange-Act-Assert, with blank lines between the three sections.
- One branch per test case, so a broken branch fails exactly one test.
- Use the helpers in src/test-support rather than writing new fakes.

## Build

```bash
bun run test     # 54 tests
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
