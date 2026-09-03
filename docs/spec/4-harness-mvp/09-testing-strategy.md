# Obsidian Agent Harness: Testing Strategy

Unit test outline for the components in
[05-component-design.md](05-component-design.md). Follows the repo's unit test
conventions: one dedicated case per branch, named "does X when Y".

FakeAdapter (Test Support) backs the skill tests unchanged. Four new doubles
join it, since nothing existing stands in for the command registry, the vault or
the editor lookup.

## New test doubles (src/test-support/)

- FakeCommandRegistry: holds a command list, records executed ids, and lets a
  test make `executeCommandById` open a given note or nothing. It also supports
  being constructed absent, so the probe path has something to test against.
- FakeWorkspace: reports an active note path that a test can change between
  calls, which is what makes the before-and-after diff testable.
- FakeVault: notes keyed by path, each with a modification time a test can set,
  which is what makes the recency filter assertable.
- FakeNoteLocator: an editor per path, so a test says which notes are open. A
  path with no editor fails the way a closed tab does, which is the case a
  command opening an unopened note has to report.

`anEngine` (Test Support) in builders.ts wires an engine the way EngineFactory
(Engine, new) does, so a test states only what it varies.

## AllowList (Commands, new)

- Exact ids: an id on the list permits, an id absent refuses.
- Pattern matching: a namespace pattern permits every id under that plugin, and
  refuses one under a different plugin whose name shares a prefix.
- Validation, one case each: a pattern with no colon is refused, a colon-less
  exact id is accepted since core commands carry no namespace, an entry with a
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

## SessionRepository (Session, new)

- Starts targeting the note it was opened on, holding no conversation.
- A changed target reads back, and resets to the original on request (FR20).
- A reset keeps the conversation, which is what separates it from a new session.
- Messages read back in the order they were appended.

## TurnRepository (Engine, new)

- Holds the note it opened on, with no edit position until one lands.
- A retarget moves both the note and its chain, so the two never disagree.
- The last edit position survives a later call that changed nothing.

## EditEngine (Engine, changed)

- Dispatch: one case per new tool, asserting the right collaborator is called.
- Retargeting (FR17): a `run_command` call that opens a note makes the following
  edit apply to the new note, not the old one.
- No retarget: a command opening nothing leaves the following edit on the
  original note.
- Opened but unopenable: a command opening a note no editor holds reports as
  opening nothing, and leaves the target where it was.
- AGENTS.md re-resolution (FR21): a retarget to a note in a different folder
  resolves that folder's chain before the next write.
- Answer terminates (FR31): a turn calling `answer_from_search` produces a panel
  answer and applies no edit, asserted by the editor being untouched.
- Per-turn caps (FR15, FR26): a fourth command and a fifth search are both
  refused with the cap message.
- Tool inventory (NFR8): a vault allowing no commands with search off is offered
  the release 3 tools exactly.
- Iteration cap: a turn reaching 10 iterations fails with the cap message.

## PromptBuilder (Engine, changed)

- Command section present: the catalogue renders as id and name pairs, and
  carries the FR11 decline instruction.
- Command section omitted: an empty catalogue produces the release 3 prompt byte
  for byte (NFR8), asserted against a stored fixture rather than a rebuilt string.
- Note snapshot: names the path and cursor, carries the content, and states that
  it supersedes earlier copies. The standing rules carry none of it.

## SessionPanel (Session, changed)

- A command entry renders with its own class and is copyable.
- An answer entry renders its sources apart from its body, and copying yields
  the body.
- An answer entry is visually distinct from an assistant entry (FR29), asserted
  by class rather than by text.
- The header names the note a command moved to, and offers a way back to the one
  the session started on (FR19, FR20).

## AllowListEditor (Settings, new)

- Entries publish one per line, with blank lines dropped.
- An invalid entry shows its reason; a valid list shows no alert.
- The resolved list counts and names its commands, collapsed by default (FR7, FR8).
