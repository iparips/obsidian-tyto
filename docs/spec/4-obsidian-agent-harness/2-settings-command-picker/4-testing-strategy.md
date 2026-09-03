# Settings Command Picker: Testing Strategy

Unit test outline for [3-component-design.md](3-component-design.md). Follows
the repo's conventions: one dedicated case per branch, named "does X when Y".

FakeCommandRegistry (Test Support) backs every test here. It already holds a
command list and supports being constructed without its methods, so the probe
path and the unreachable-registry case need no new double. It exposes only
`asApp()` today, and gains a way to serve as a CommandRegistry (Commands, new)
directly.

## CommandRegistry (Commands, new)

- Lists every registered command, allowed or not.
- Yields nothing when the registry methods are absent, rather than throwing.
- Drops a command the registry reports as unavailable (FR15).
- Executes a command by id, and reports whether the registry accepted it.

The catalogue's and runner's existing suites are the real check on this step:
they must pass with only their construction changed.

## AllowList (Commands, changed)

- `coveringEntry` names the exact entry that permitted an id.
- It names the pattern when a pattern permitted it, not the id.
- It returns nothing when no entry permits, and `permits` still agrees with it.

## CommandSearch (Commands, new)

- Empty query: returns nothing, not everything (FR4). The case that keeps the
  picker usable in a vault with several hundred commands.
- Matches a substring of the display name, ignoring case.
- Does not match against the id, so a query that reads like an id finds nothing
  unless a name contains it.
- More matches than the cap: returns exactly the cap, and reports that more
  matched (FR3).
- Fewer than the cap: reports no overflow.
- Marks a match the allow-list already covers, by exact id and by pattern
  separately (FR6).
- Unreachable registry: returns nothing rather than failing (NFR3).

## CommandMatch (Commands, new)

- Reports itself covered when an entry covers it, and uncovered when none does.

## CommandPicker (Settings, new)

- Typing a query renders the matches; clearing it renders nothing.
- Choosing a command publishes its exact id, and no name (NFR1).
- Choosing appends to the entries already stored, rather than replacing them.
- Choosing clears the query, so the results close over the list they changed.
- A command already covered renders as covered and cannot be chosen again.
- The overflow line appears only when the search reported more than the cap.

## AllowedEntries (Settings, new)

- Renders one row per entry, each removable (FR9).
- Removing publishes the remaining entries, and an empty list when the last goes.
- Editing a row publishes the edited entry, leaving the others untouched (FR12).
- An edited row that breaks the entry rule shows why, and keeps what was typed
  rather than reverting it (FR13).

## ResolvedCommands (Settings, new)

- Counts what the whole allow-list reaches, and says it in the summary (FR10).
- Names each resolved command with its id when the section is expanded.
- Renders collapsed, so the entries stay the setting.
- A count that disagrees with the entry list is what surfaces a dead entry
  (FR11).

## AllowListEditor (Settings)

- An entry added by the picker appears as a row, so the two surfaces agree.
