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
- As a user allowing a second command from the same plugin, I am offered the
  namespace pattern instead, and shown the commands it would cover.
- As a user whose picked command has a positional id, I am told that entry will
  shift if I reorder that plugin's configs, and offered the pattern instead.
- As a user on a phone, I search and tap rather than typing a colon-separated id.

## Names are the search key, never the match key

The picker searches names. The allow-list continues to store and match ids.

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

The two have to meet somewhere, and this is the part the design must settle.

- Picking a second command from a plugin already represented is the moment to
  offer the pattern. What that offer looks like, and whether accepting it
  replaces the individual entries, is a design question.
- A pattern's reach changes without the user editing it (FR6). The picker is
  where that reach is most visible, so showing it at the moment of choosing is
  worth more than showing it afterwards.
- Positional ids are the case where an exact entry is actively wrong. Detecting
  them is heuristic: an id whose command-part is an integer. Whether to warn, to
  refuse, or to silently prefer the pattern is a design question.

## Requirements

FR1. List every command Obsidian currently offers, with its display name and id.

FR2. Filter that list by a typed query, matching on the display name.

FR3. Add a listed command to the allow-list as its exact id, in one action.

FR4. Show which listed commands the allow-list already covers, so the same
command is not added twice and a pattern's reach is visible in context.

FR5. Offer the namespace pattern when a picked command's plugin already has an
entry, and show how many commands that pattern covers.

FR6. Warn when a picked command's id is positional, naming the risk that the
entry shifts when the user reorders that plugin's configuration.

FR7. Remove an entry from the allow-list without editing text.

FR8. Keep the hand-editable text field, so a pattern can be written directly and
an entry pasted from elsewhere still works.

FR9. Keep the surface usable on a phone: the picker is search-first, and the
results list scrolls rather than filling the screen.

FR10. Exclude commands Obsidian reports as unavailable, matching the catalogue
the model is offered (FR10 of the harness MVP).

## Non-functional requirements

NFR1. The allow-list stores ids only. No name reaches settings storage, so a
renamed command changes nothing about what is allowed.

NFR2. The picker reads the same command list the catalogue resolves against, so
what a user sees is what the model would be offered.

NFR3. A vault whose registry is unreachable (NFR4 of the harness MVP) shows an
empty picker and keeps the text field, rather than failing to render settings.
