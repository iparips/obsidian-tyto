# Obsidian Agent Harness: Component Design

Delta on the AGENTS.md Loading design. Unlisted components are unchanged.
Covers the packages, the private-API question, and what the two flows share.

Commands in detail: [5-commands-and-rebinding.md](5-commands-and-rebinding.md).
Search in detail: [6-search-and-answering.md](6-search-and-answering.md).

## Source tree

```
src/commands/
  command-catalogue.ts     # allowed commands, resolved from the live list
  command-runner.ts        # runs one command, reports what opened
  allow-list.ts            # entries, and the pattern rule
  models/
    allowed-command.ts     # one id and display name pair
    command-effect.ts      # what changed after a command ran

src/search/
  vault-search.ts          # scored matches over markdown files
  note-reader.ts           # one named note, read in full
  models/
    search-hit.ts          # path, score and excerpt
```

Two packages, not one. Commands acts on the vault through Obsidian; Search only
reads it. They share no code, and the flows they serve are independent by FR30,
so merging them would give one package two reasons to change.

Engine gains both dependencies. Nothing else moves.

## Both Private APIs Are Reachable

The two feasibility questions resolve in opposite directions, and neither
blocks the release.

| Need               | Surface                         | Public |
| ------------------ | ------------------------------- | ------ |
| List commands      | app.commands.listCommands       | No     |
| Run a command      | app.commands.executeCommandById | No     |
| Score a text match | prepareSimpleSearch             | Yes    |
| Enumerate notes    | Vault.getMarkdownFiles          | Yes    |
| Read a note        | Vault.cachedRead                | Yes    |

Search needs no private API at all. prepareSimpleSearch is exported from the
obsidian module and returns a scored SearchResult with match offsets, which is
what an excerpt needs. The scan is therefore the design, and driving Obsidian's
search view is rejected: the view renders results for a person rather than
returning them, so reading them back would mean parsing the DOM.

Commands needs two private methods. The Command interface is public and typed;
only the registry holding them is not. Both are reached through one module
augmentation, declared once in the Commands package:

```typescript
declare module 'obsidian' {
  interface App {
    commands: {
      listCommands(): Command[]
      executeCommandById(id: string): boolean
    }
  }
}
```

This is the same access the vault's own open-or-create-file plugin already
relies on, so the surface is load-bearing for plugins in the wild rather than
incidental. It is still not covered by Obsidian's compatibility promise, which
NFR4 answers: CommandCatalogue (Commands, new) probes for the methods on
construction and yields an empty catalogue when they are absent, so the harness
degrades to search only rather than failing to load.

## Prompt Additions

PromptBuilder (Engine) gains a command section, built the same way as the skill
catalogue: omitted entirely when the catalogue is empty, so a vault allowing no
commands produces the release 3 prompt byte for byte (NFR8).

The section carries the id and name pairs (FR9) and one standing instruction:
decline a command whose effect cannot be determined from its name, and say
which and why (FR11). NFR3 states what that instruction is worth. It is a second
layer over a list the user may have widened by pattern, not the thing keeping
destructive commands out of reach.

## Iteration Cap

The cap rises from 6 to 10, and stays one number rather than becoming per-flow.

A search turn spends calls the edit loop never did: a search, one or two reads,
then the answer. Six leaves no room for the model to refine a query once. Ten
covers the longest sensible chain, which is a command, a search, two reads and
an edit, with a call to spare.

Per-flow caps were rejected. The loop does not know which flow it is in until
the model calls a tool, and a turn may legitimately use both, so a single cap is
the only one that can be enforced where the counting happens.
