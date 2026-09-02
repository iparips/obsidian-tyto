# Design: Obsidian Agent Harness

Covers release 4 of [2-plan.md](../2-plan.md): running Obsidian commands, rebinding the session to the note one opens, and searching the vault to answer a question. Delta design on top of [3-agents-md-loading.md](3-agents-md-loading.md). Requirement IDs refer to [4-obsidian-agent-harness/2-functional-requirements.md](../4-obsidian-agent-harness/2-functional-requirements.md).

Not yet designed. Five open questions in [4-obsidian-agent-harness/3-decisions.md](../4-obsidian-agent-harness/3-decisions.md) gate it, two of which decide whether the release is buildable as specced.

## What the Requirements Already Fix

The shape below is settled by the requirements and is not open for the design to revisit.

- Two flows share the agent loop and nothing else. A command resolves a destination and an edit may follow; a search reads and terminates at the panel (FR25).
- The model never chooses a write path. Destinations come from commands, which resolve them through the user's own configuration.
- A search answer is a copyable panel block citing its source notes, never a note write (FR21, FR22).
- The command surface is an allow-list the user edits, and nothing in a prompt, skill or AGENTS.md file can widen it (NFR1).

## What the Design Must Settle

Two questions decide feasibility, three decide shape. All five are stated in full in [3-decisions.md](../4-obsidian-agent-harness/3-decisions.md).

| Question              | Decides     | Risk if it goes badly                             |
| --------------------- | ----------- | ------------------------------------------------- |
| Command enumeration   | Feasibility | No command tool; the release is search only       |
| Search implementation | Feasibility | Scan cost or a view the plugin cannot read back   |
| Iteration cap sizing  | Shape       | Search turns exhaust the loop before answering    |
| Command effect checks | Shape       | An edit follows a command that did something else |
| Answer panel entry    | Shape       | An answer reads as an edit that never happened    |

Command enumeration is the one to resolve first. The Command interface is public in the Obsidian typings, but the registry holding every registered command is not on the typed App class. Confirm what runtime surface exists, and design the command tool so its absence degrades to a search-only harness rather than a broken plugin (NFR3).

## Rebinding Is the Core Change

The session binds one TFile at start, and WorkspaceNoteLocator (Engine) finds its editor each turn. Making that binding movable is the smallest change that unlocks every command-and-edit story, and it is where the design should start once enumeration is settled.

The binding moves as a tool result, never silently. The model is told the target changed, because an anchor applied to the wrong note is the failure this release most needs to avoid (FR8, FR11).

## Out of Scope

Search-and-edit, creating a note at a model-chosen path, and multi-file writes. The first two are the same risk: a destination the model picked rather than one Obsidian computed. Multi-file writes arrive in [7-cross-file-skills/index.md](../7-cross-file-skills/index.md).
