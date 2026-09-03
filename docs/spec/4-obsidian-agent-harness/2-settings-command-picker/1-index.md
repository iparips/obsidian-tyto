# Settings Command Picker: Spec

Lets a user allow a command without knowing its id. The allow-list stores ids,
and nothing in Obsidian shows a user what an id is: the palette shows names.

A delta on [1-harness-mvp](../1-harness-mvp/01-index.md), which built the
allow-list and its text field. Only the settings surface changes; the matching
rule, the catalogue and the prompt are untouched.

- [2-requirements.md](2-requirements.md) - problem, why names stay the search key, and the wildcard question
- [3-component-design.md](3-component-design.md) - the registry split, matching, and where names are resolved
- [4-testing-strategy.md](4-testing-strategy.md) - unit test outline, reusing the existing registry fake
- [5-implementation-order.md](5-implementation-order.md) - the build sequence and the exit test

A vault offers several hundred commands, so the picker searches rather than
lists. Nothing renders before a query is typed.

The allow-list stays a list of ids and patterns, editable in place. Below it, a
collapsed section resolves the whole list against the registry: every command
the entries currently reach, by name and id. Nothing resolved is stored, so a
retitled command shows its new name on the next render.

Built. The wildcard question is settled by leaving it to the user: choosing a
command stores its exact id and nothing else happens. A user wanting a pattern
types it over an entry, and the resolved section shows what it reaches.
