# Design: Obsidian Agent Harness

Covers release 4 of [2-plan.md](../spec/2-plan.md): running Obsidian commands, rebinding the session to the note one opens, and searching the vault to answer a question. Delta design on top of [3-agents-md-loading.md](3-agents-md-loading.md). Requirement IDs refer to [4-harness-mvp/2-functional-requirements.md](../spec/4-harness-mvp/03-functional-requirements.md).

Designed in [4-harness-mvp/4-component-design.md](../spec/4-harness-mvp/05-component-design.md). Both feasibility questions are settled: search needs no private API, and the command registry is reachable through a module augmentation with an empty-catalogue fallback.

## What the Requirements Already Fix

The shape below is settled by the requirements and is not open for the design to revisit.

- Two flows share the agent loop and nothing else. A command resolves a destination and an edit may follow; a search reads and terminates at the panel (FR31).
- The model never chooses a write path. Destinations come from commands, which resolve them through the user's own configuration.
- A search answer is a copyable panel block citing its source notes, never a note write (FR27, FR28).
- The command surface is an allow-list the user edits, and nothing in a prompt, skill or AGENTS.md file can widen it (NFR1).
- Allow-list entries are command ids or namespace patterns, where the plugin id is literal and only a trailing wildcard is permitted (FR4), and the prompt asks the model to decline a command it cannot identify (FR11).

## What the Design Settled

All five questions are closed, with the reasoning in [04-decisions.md](../spec/4-harness-mvp/04-decisions.md).

| Question              | Answer                                                                    |
| --------------------- | ------------------------------------------------------------------------- |
| Iteration cap sizing  | Raised to 10, one cap rather than per-flow                                |
| Command effect checks | The before-and-after diff, plus a check that an editor holds the new note |
| Answer panel entry    | The copyable entry, with sources rendered below the body                  |
| Mobile settings       | One entry per line, with the resolved list collapsed to a count           |
| Destructive core ids  | No denylist; the user typing a namespace is what permits it               |

Command enumeration turned out to be the smaller risk. The registry is not on the typed App class, but listCommands and executeCommandById are reachable through a module augmentation, and the vault's own open-or-create-file plugin already depends on them. CommandCatalogue probes for the methods and yields an empty catalogue when they are missing, so their loss costs the command flow rather than the plugin (NFR4).

## Rebinding Is the Core Change

The session binds one TFile at start, and WorkspaceNoteLocator (Engine) finds its editor each turn. Making that binding movable is the smallest change that unlocks every command-and-edit story, and it is where the design should start once enumeration is settled.

The binding moves as a tool result, never silently. The model is told the target changed, because an anchor applied to the wrong note is the failure this release most needs to avoid (FR14, FR17).

## Out of Scope

Search-and-edit, creating a note at a model-chosen path, and multi-file writes. The first two are the same risk: a destination the model picked rather than one Obsidian computed. Multi-file writes arrive in [13-cross-file-skills/index.md](../spec/13-cross-file-skills/1-index.md).
