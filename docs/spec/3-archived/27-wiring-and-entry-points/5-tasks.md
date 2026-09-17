---
created: 2026-09-14
updated: 2026-09-14
---

# Tasks

Five commits. The suite stays green at each, and no commit changes behaviour.

Prettier reformats unrelated files on a build. Per
[AGENTS.md](../../../../AGENTS.md), keep that reformatting and commit it separately as
a whitespace commit rather than reverting it.

## Commit 1: wiring takes the two composition roots

src/wiring (new) takes engine-factory and session-builder by git mv. Both keep
their class names.

Importers to fix: main.ts builds both, session-builder imports EngineFactory
from engine, and the tests that construct either. EngineFactory's own imports
all shift one level, since it moves from src/engine to src/wiring.

Engine then constructs nothing from session. Confirm that before moving on:
grep src/engine for new SessionRepository and new TranscriptRepository, and
expect no hit outside turn-runner-factory, which commit 2 handles.

## Commit 2: the scopes read as scopes

turn-runner-factory still defaults a TranscriptRepository, so it constructs
across a boundary from inside engine. Move that default up into EngineFactory,
which already passes the repository in every real call path. The parameter stays
required rather than defaulted.

Then add PluginScope to wiring, holding what outlives a session: app, settings,
SkillRepository, AgentsMdRepository. EngineFactory takes a PluginScope rather
than four separate fields, so the nesting is visible at the constructor.

main.ts builds the PluginScope once at load, which is where those four are
already built.

## Commit 3: capture becomes recorder

src/capture holds one file, recorder.ts, declaring Recorder and the Utterance
value beside it. It becomes src/recorder/index.ts, unchanged in content.

Two files import from it: session-builder takes Recorder, and
views/hooks/useRecording takes Utterance. Other files name Utterance in their
signatures without importing from capture, so fix by import path rather than by
type name.

Utterance stays inside index.ts. Splitting it into its own file is a change this
spec did not ask for, and a value beside the service that returns it is where
the code-generation skill already puts it.

This is the smallest entry point in the tree and the only one needing nothing
invented, so it proves the shape before the harder packages are touched.

## Commit 4: misplaced repositories

Two repositories filed in models folders move beside the services that use them.
The value types stay where they are: no cycle runs through them, so a package
boundary would buy nothing. [8-value-types.md](8-value-types.md) carries both
decisions and the resulting counts.

## Commit 5: the architecture doc records the building block

[architecture/7-package-design.md](../../../architecture/7-package-design.md)
gains wiring in the package table, the three package kinds in the layout
section, and a redrawn dependency graph with wiring above the services.

The doc's claim that engine depends on session for nothing is wrong today.
Correct it: record the ten remaining type dependencies and name the ports spec
as what closes them.

## After the commits

The suite proves behaviour is unchanged. Three checks it cannot make:

- Grep for construction across a package boundary outside src/wiring and
  test-support, and confirm none.
- Confirm src/engine constructs neither SessionRepository nor
  TranscriptRepository.
- Recount every folder against the ten-file limit.

A run against a real vault is not needed: no prompt text, schema or tool
behaviour moves.
