---
created: 2026-09-14
updated: 2026-09-14
---

# Requirements

Construction knowledge lives in one package. Every other package is reached
through a named entry point rather than through its interior.

## Motivation

EngineFactory already says what it is: "the only place that knows how they fit
together". It behaves as a DI container, resolved by hand at compile time rather
than by reflection at runtime. Nothing in the tree records that, so the class
sits inside engine and drags engine's dependencies with it.

The cost shows up twice. Engine imports session, commands, search and settings
from its own factory, which reverses the documented dependency direction. And
because any file may construct any class, a package has no interior: every one
of its files is public whether it means to be or not.

## In Scope

- A wiring package holding EngineFactory and SessionBuilder, the two composition
  roots, named for the job rather than for a pattern.
- The scope nesting made visible: plugin lifetime, session lifetime, panel
  lifetime, each holding the one below it.
- An index.ts entry for every package that has a single owning service, with the
  package renamed to match that service.
- Two repositories filed in models folders moved beside the services that use
  them. Value types stay inside their packages: no cycle runs through them.
- A survey of the packages with no single owner, so a later spec can decide
  what each becomes.

## What decides where a class lives

Three package kinds, and one rule each.

| Kind    | Owns                   | May construct across packages | Named after       |
| ------- | ---------------------- | ----------------------------- | ----------------- |
| Wiring  | Construction knowledge | Yes, every package            | Its job           |
| Service | Behaviour, one entry   | No                            | Its entry service |
| Value   | Types, no behaviour    | No                            | The concept       |

The rule that follows: a file may construct a class from another package only
if it lives in wiring. Everything else codes against an entry point.

This replaces an exemption with a role. The question stops being whether a file
is EngineFactory and becomes whether it lives in the package whose job is
wiring, which is answerable by looking at the path.

## What may not change

- Behaviour. Every test passes before and after, unchanged except for import
  paths.
- Class names. EngineFactory and SessionBuilder keep theirs; only their folder
  moves.
- The ten-file limit from
  [26-packages-over-the-limit](../26-packages-over-the-limit/1-index.md). No
  folder this spec creates or feeds may exceed it.
- The release 3 prompt fixture, which no file here touches.

## Test Scenarios

### Construction across packages happens only in wiring

```gherkin
When  the source files outside src/wiring are read
Then  none constructs a class imported from another package
```

### The suite is unchanged

```gherkin
Given the wiring package and the entry points have landed
When  the unit suite runs
Then  every test passes
And   no test changed except its import paths
```

### Engine no longer constructs session

```gherkin
Given EngineFactory has moved to wiring
When  the imports in src/engine are read
Then  no file there constructs SessionRepository or TranscriptRepository
```

## Questions

- Whether the four packages with no single owner should gain a facade service,
  or stay multi-entry under a plural name. The survey lists them; the decision
  needs their shape, so this spec records it rather than settling it.
- Whether test-support may reach package interiors. It constructs across every
  boundary today, and it is test-only, so the rule either exempts it or it
  becomes a second wiring package.

## References

### Task

- [4-survey.md](4-survey.md) - open first; what each package exposes today
- [src/wiring/engine-factory.ts](../../../../src/wiring/engine-factory.ts) - the container this spec names
- [src/wiring/session-builder.ts](../../../../src/wiring/session-builder.ts) - the scope above it

### Project

- [26-packages-over-the-limit](../26-packages-over-the-limit/1-index.md) - the file limit this spec must keep

### Architecture

- [architecture/7-package-design.md](../../../architecture/7-package-design.md) - the dependency rule and the package table this updates
