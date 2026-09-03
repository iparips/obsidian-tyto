# Settings Command Picker: Spec

Lets a user allow a command without knowing its id. The allow-list stores ids,
and nothing in Obsidian shows a user what an id is: the palette shows names.

A delta on [1-harness-mvp](../1-harness-mvp/01-index.md), which built the
allow-list and its text field. Only the settings surface changes; the matching
rule, the catalogue and the prompt are untouched.

- [2-requirements.md](2-requirements.md) - problem, why names stay the search key, and the wildcard question
- [3-component-design.md](3-component-design.md) - the registry split, matching, and how a pattern is offered
- [4-testing-strategy.md](4-testing-strategy.md) - unit test outline, reusing the existing registry fake
- [5-implementation-order.md](5-implementation-order.md) - the build sequence and the exit test

A vault offers several hundred commands, so the picker searches rather than
lists. Nothing renders before a query is typed.

The allow-list becomes a table: the entry on the left, editable, and what it
currently reaches on the right. Names are resolved from the registry each render
and never stored, so a retitled command shows its new name and a pattern shows
the count it covers.

Designed, not built. The wildcard question is settled in
[3-component-design.md](3-component-design.md): the picker offers the pattern
when a second command from the same plugin is added, shows what it reaches, and
replaces that plugin's individual entries when accepted.
