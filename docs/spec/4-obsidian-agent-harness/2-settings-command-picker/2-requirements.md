# Requirements: Settings Command Picker

Let a user allow a command without knowing its id, and see what a pattern
reaches before saving it.

## Problem

The allow-list stores command ids, and nothing in Obsidian shows a user what an
id is. The palette shows names.

The gap is widest exactly where the allow-list matters most. A plugin that
registers commands positionally names them in the palette as "Open or Create
File: Shopping list" and registers them as `open-or-create-file-command:3`. The
index is not derivable from the name, not stable across a settings edit, and not
visible anywhere in the app.

So the current surface asks for a value the user cannot look up, to configure the
mechanism that keeps destructive commands out of reach.

Scale rules out browsing. A vault with the core plugins on and a handful of
community ones offers several hundred commands, most of them editor operations
nobody would allow. The reference vault runs 24 core plugins and three community
ones, and one of those three contributes nine commands by itself. A picker that
renders the list is unusable; one that searches it is not.

## Goals

- Find a command by the name shown in the palette, and allow it in one action.
- Show a command's id, so a hand-written entry is possible and a stored entry is
  legible.
- Let a user allow a whole plugin's commands, and see what that covers before
  committing to it.
- Warn when a picked command's id looks positional, since that entry means
  something different after the user reorders their configs.

## Non-goals

- Matching the allow-list on names. Ids are what the list stores and what it
  matches; see the decision below.
- Editing the allow-list from anywhere but settings.
- Reordering entries, or grouping them. The list is short and unordered.

## User stories

- As a user, I search "shopping" in settings, see "Open or Create File: Shopping
  list", and allow it without typing an id.
- As a user, I see the id an entry resolves to, so what I allowed is legible
  later.
- As a user allowing a second command from the same plugin, I see the namespace
  pattern suggested beside it, with what it would cover, and can ignore it.
- As a user whose picked command has a positional id, I am told that entry will
  shift if I reorder that plugin's configs, with the pattern suggested instead.
- As a user on a phone, I search and tap rather than typing a colon-separated id.

## Names are the search key, never the match key

The picker searches names, and the entry list shows them. The allow-list
continues to store and match ids.

A name shown beside an entry is resolved from the registry each time it renders,
never stored. Storing one would go stale on a plugin update, and a pattern has no
single name to store: `daily-notes:*` covers many commands, so what it reaches is
a count rather than a title.

Ids are the stable identifier. A plugin author retitling a command in an update
would silently narrow an allow-list matched on names, and the user would find a
command stopped working with nothing to point at. FR4's colon rule also depends
on ids: names carry no namespace, so a pattern over names could reach across
plugins in a way `plugin-id:*` cannot.

Names are also not unique. "Open or Create File: Todo" and "Open or Create File:
Next Week's Todo" differ by a prefix, so a name match needs substring or fuzzy
rules, and ambiguity in the matcher is ambiguity in the thing keeping destructive
commands unreachable.

The model already works this way, and it works: FR9 gives it id and name pairs,
it chooses by name and calls by id.

## The wildcard question

A picker adds one command. A pattern covers many, and the harness MVP made
patterns necessary rather than convenient, because positional ids shift when the
user reorders their configs.

The two meet in a suggestion, settled in
[3-component-design.md](3-component-design.md).

- Adding always stores the exact id. The pattern appears beside the entry it
  would replace, and is ignorable without dismissing, so a user who does not
  want to think about namespaces is never stopped to.
- A pattern's reach changes without the user editing it (FR6), so the count is
  shown with the suggestion rather than discovered after accepting it.
- Positional ids warn rather than refuse. Detecting them is a heuristic about a
  plugin convention, not a rule Obsidian enforces, so a false positive should
  cost one extra line and nothing else.

## Requirements

FR1. Search every command Obsidian currently offers. A vault runs to several
hundred, so the full list is the search space, never the rendered list.

FR2. Narrow by a typed query, matching on the display name, and render only
what matches.

FR3. Cap the rendered results, and say when a query matched more than the cap,
so a broad query stays readable rather than painting hundreds of rows.

FR4. Render nothing before a query is typed, apart from what the allow-list
already covers. An unfiltered picker is the case FR1 exists to avoid.

FR5. Add a listed command to the allow-list as its exact id, in one action.

FR6. Show which listed commands the allow-list already covers, so the same
command is not added twice and a pattern's reach is visible in context.

FR7. Suggest the namespace pattern when a picked command's plugin already has an
entry, showing how many commands it covers. The suggestion needs no dismissing:
the command is added as its exact id either way.

FR8. Warn when a picked command's id is positional, naming the risk that the
entry shifts when the user reorders that plugin's configuration.

FR9. Remove an entry from the allow-list without editing text.

FR10. Show each entry beside what it currently reaches: the display name for an
exact id, and the count for a pattern.

FR11. Say when an entry reaches nothing, so an id whose plugin was disabled or
renamed is visible rather than silently inert.

FR12. Keep every entry editable in place, so a pattern can be typed over an id
the picker added and an entry pasted from elsewhere still works.

FR13. Validate an edited entry as it is typed, showing the reason it is refused
without discarding what the user typed.

FR14. Keep the surface usable on a phone: the picker is search-first, and the
results list scrolls rather than filling the screen.

FR15. Exclude commands Obsidian reports as unavailable, matching the catalogue
the model is offered (FR10 of the harness MVP).

## Non-functional requirements

NFR1. The allow-list stores ids and patterns only. A name is resolved from the
registry for display and never persisted, so a retitled command shows its new
name and a stale one cannot accumulate in settings.

NFR2. The picker reads the same command list the catalogue resolves against, so
what a user sees is what the model would be offered.

NFR3. A vault whose registry is unreachable (NFR4 of the harness MVP) shows an
empty picker and keeps the text field, rather than failing to render settings.
