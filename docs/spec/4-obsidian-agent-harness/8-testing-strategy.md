# Obsidian Agent Harness: Testing Strategy

Unit test outline for the components in
[4-component-design.md](4-component-design.md). Follows the repo's unit test
conventions: one dedicated case per branch, named "does X when Y".

FakeAdapter (Test Support) backs the search tests unchanged. Commands needs one
new fake, since no existing double stands in for the command registry.

## New test doubles (src/test-support/)

- FakeCommandRegistry: holds a command list, records executed ids, and lets a
  test make `executeCommandById` open a given note or nothing. It also supports
  being constructed absent, so the probe path has something to test against.
- FakeWorkspace: reports an active note path that a test can change between
  calls, which is what makes the before-and-after diff testable.

## AllowList (Commands, new)

- Exact ids: an id on the list permits, an id absent refuses.
- Pattern matching: a namespace pattern permits every id under that plugin, and
  refuses one under a different plugin whose name shares a prefix.
- Validation, one case each: an entry with no colon is refused, an entry with a
  wildcard in the plugin id is refused, a wildcard after the colon is accepted,
  and an exact id with no wildcard is accepted.
- Validation happens on save: an invalid entry surfaces as an error rather than
  silently matching nothing.
- Empty list permits nothing.

## CommandCatalogue (Commands, new)

- Resolution: a pattern matching two of four registered commands yields those
  two, in the registry's order.
- Liveness (FR6): a command registered after construction appears on the next
  resolve without the allow-list changing.
- Availability (FR10): a command the registry reports as unavailable is dropped.
- Probe (NFR4): a registry missing `listCommands` yields an empty catalogue
  rather than throwing, and a missing `executeCommandById` does the same.
- Empty allow-list yields an empty catalogue, and the prompt section is omitted
  entirely (NFR8).

## CommandRunner (Commands, new)

- Refusal (FR13): an id outside the catalogue returns a refusal naming the id,
  and the registry is never called.
- Opened a note: the active path differs after the run, so the effect rebinds
  and names the new path.
- Opened nothing: the active path is unchanged, so the effect does not rebind.
- Same note reopened: a command that reopens the already-bound note counts as
  opening nothing, since the binding does not move.
- Cap (FR15): a turn exceeding the per-turn command cap refuses further runs.

## VaultSearch (Search, new)

- Scoring: a note matching the query twice outranks one matching once.
- No hits: an unmatched query returns an empty list, which FR29 renders as
  "found nothing" rather than an answer.
- Result cap (FR22): more matches than the cap returns exactly the cap, keeping
  the highest scores.
- Excerpt width: a match mid-note yields an excerpt trimmed around the offset,
  and a match at the start of a note does not underflow.
- Recency (FR24): `modified_within_days` drops older notes before scoring, and
  an old exact match cannot outrank a recent weaker one because it is gone.
- Recency absent: no filter means every note is a candidate.

## NoteReader (Search, new)

- Reads a note by path, returns its full contents.
- A missing path returns a failure the model can act on, not an exception.
- Reading never rebinds the session, asserted by the locator being untouched.

## EditEngine (Engine, changed)

- Dispatch: one case per new tool, asserting the right collaborator is called.
- Rebinding (FR17): a `run_command` call that opens a note makes the following
  `replace_text` apply to the new note, not the old one.
- No rebind: a command opening nothing leaves the following edit on the original
  note.
- AGENTS.md re-resolution (FR20): a rebind to a note in a different folder
  resolves that folder's chain before the next write.
- Answer terminates (FR30): a turn calling `answer_from_search` produces a panel
  answer and applies no edit, asserted by the editor being untouched.
- Iteration cap: a turn reaching 10 iterations fails with the cap message.

## PromptBuilder (Engine, changed)

- Command section present: the catalogue renders as id and name pairs, and
  carries the FR11 decline instruction.
- Command section omitted: an empty catalogue produces the release 3 prompt byte
  for byte (NFR8), asserted against a stored expected string.

## SessionPanel (Session, changed)

- A command entry renders with its own class and is copyable.
- An answer entry renders its sources apart from its body, and copying yields
  the body.
- An answer entry is visually distinct from an assistant entry (FR28), asserted
  by class rather than by text.
