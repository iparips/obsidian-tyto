# Finding Notes: Testing Strategy

Unit test outline for [3-component-design.md](3-component-design.md). Follows the
repo's conventions: one dedicated case per branch, named "does X when Y".

Two properties carry the risk. A glob must read no note contents (NFR2), which
FakeVault can assert directly since it records every read. And a pattern must
match a real vault's paths, so the fixtures use the shape that failed:
`1 - Journal/Weekly/Week-35/04-09-Fri.md`, spaces and hyphens included.

## Table of Contents

1. [PathPattern (Search, new)](#pathpattern-search-new)
2. [ResultOrder (Search, new)](#resultorder-search-new)
3. [NoteGlob (Search, new)](#noteglob-search-new)
4. [NoteGrep (Search, new)](#notegrep-search-new)
5. [HarnessTools (Engine, changed)](#harnesstools-engine-changed)
6. [TurnBudget (Engine, changed)](#turnbudget-engine-changed)
7. [RuleBuilder (Engine, changed)](#rulebuilder-engine-changed)
8. [EditEngine (Engine, changed)](#editengine-engine-changed)

## PathPattern (Search, new)

- Matches a literal path when the pattern has no wildcard.
- Matches within one segment when the pattern has a star.
- Does not cross a separator on a star, so `Weekly/*.md` misses a nested note.
- Crosses separators on a double star.
- Matches a note at the vault root on `**/*.md`, so a leading double star may
  match nothing.
- Matches one character on a question mark.
- Does not match a separator on a question mark.
- Matches whatever the case, so `week-35` finds `Week-35`.
- Escapes a regular-expression character in a folder name, so `Notes (old)`
  matches literally.
- Matches a folder name holding spaces and hyphens, as `1 - Journal` does.
- Refuses a pattern that cannot compile, rather than throwing.

## ResultOrder (Search, new)

- Orders by path ascending when nothing is asked for.
- Orders by path when path is asked for.
- Orders by modified descending when modified is asked for, so newest is first.
- Orders modified ascending when ascending is asked for.
- Orders path descending when descending is asked for.
- Falls back to path when the sort field is not recognised.
- Falls back to the field's own default when the direction is not recognised.

## NoteGlob (Search, new)

- Returns the notes matching the pattern.
- Returns them in path order when nothing is asked for.
- Returns the newest first when modified is asked for.
- Returns an empty result when nothing matches, rather than failing.
- Reads no note contents, so a listing costs no read.
- Caps the results when more notes match than the cap.
- Says the cap trimmed the results when it did.
- Says nothing was trimmed when the results fit.
- Refuses a pattern that cannot compile, naming it.

## NoteGrep (Search, new)

- Returns the notes whose contents match the expression.
- Returns an excerpt around the match when excerpts are wanted.
- Returns no excerpt when paths alone are asked for.
- Counts every match in a note, not only the first.
- Orders by match count when matches is asked for.
- Reads only the notes the path pattern admits, so narrowing costs no read.
- Reads every note when no path pattern is given.
- Returns an empty result when the expression matches nothing.
- Refuses an invalid expression by saying so, rather than failing the turn.
- Caps the results when more notes match than the cap.

## HarnessTools (Engine, changed)

- Runs a glob when glob_notes is called.
- Runs a grep when grep_notes is called.
- Records the paths of a glob, so a following open is permitted.
- Records the paths of a grep, so a following open is permitted.
- Refuses a glob when the glob budget is spent, naming the cap.
- Refuses a grep when the grep budget is spent, naming the cap.
- Spends the glob budget separately from the grep budget.
- Omits both tools from the schemas when search is disabled.
- Omits glob_notes from the schemas once its budget is spent.
- Omits grep_notes from the schemas once its budget is spent.
- Offers search_vault nowhere, since it no longer exists.
- Reports a glob as a step, naming the pattern and the count.
- Reports a grep as a step, naming the expression and the count.

## TurnBudget (Engine, changed)

- Permits globs up to the cap.
- Refuses a glob past the cap, naming it.
- Permits greps up to the cap.
- Refuses a grep past the cap, naming it.
- Counts globs separately from greps, so one flow does not spend the other's.
- Names glob_notes as spent when the glob cap is reached.
- Names grep_notes as spent when the grep cap is reached.

## RuleBuilder (Engine, changed)

- States the order to try: command, glob, grep, read.
- Tells the model to glob before guessing a filename.
- Mentions search_vault nowhere.
- Produces the release 3 prompt byte for byte when commands and search are both
  absent.

## EditEngine (Engine, changed)

- Globs a folder and edits the note it names, end to end.
- Greps for a phrase and reads the note that held it, end to end.
- Opens a note a glob returned, so a glob feeds open_note.
- Opens a note a grep returned, so a grep feeds open_note.
- Stops offering glob_notes once the glob budget is spent.
- Answers a question about the vault from what a grep returned.
