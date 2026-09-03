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

- Reports whether an entry covers it, and whether that entry was a pattern.
- Detects a positional id, where the part after the colon parses as an integer.
- Does not treat an id with digits inside a word as positional, so
  `daily-notes:goto-day-2` is an ordinary id.

## CommandPicker (Settings, new)

- Typing a query renders the matches; clearing it renders nothing.
- Adding a command publishes its exact id, and no name (NFR1).
- Adding a second command from a plugin already listed stores its exact id, and
  suggests the pattern with the count it reaches (FR7).
- Accepting the suggestion replaces that plugin's individual entries.
- Ignoring it keeps both ids, and needs no dismissal to add a third command.
- The suggestion goes when the user types the pattern by hand, since it is
  derived from the entries rather than stored.
- No suggestion when the picked command's plugin has no other entry.
- A positional id shows the warning; an ordinary id does not (FR8).
- A command already covered renders as covered, with no add control.
- The overflow line appears only when the search reported more than the cap.

## EntryReach (Commands, new)

- An entry matching one command describes it by name.
- An entry matching several describes a count, not a name.
- An entry matching none reports that it reaches nothing (FR11).

## EntryReachResolver (Commands, new)

- One reach per entry, in the order the entries are stored.
- An entry whose plugin is gone still yields a row, reaching nothing.
- An unreachable registry yields a row per entry, all reaching nothing (NFR3).

## AllowedEntries (Settings, new)

- Renders one row per entry, each removable (FR9).
- Removing publishes the remaining entries.
- Renders what each entry reaches beside it, a name or a count (FR10).
- Marks an entry that reaches nothing (FR11).
- Editing a row publishes the edited entry (FR12).
- An edited row that breaks the entry rule shows why, and keeps what was typed
  rather than reverting it (FR13).
- An entry added by the picker appears as a row, so the two surfaces agree.
