# Settings Command Picker: Spec

Lets a user allow a command without knowing its id. The allow-list stores ids,
and nothing in Obsidian shows a user what an id is: the palette shows names.

A delta on [1-harness-mvp](../1-harness-mvp/01-index.md), which built the
allow-list and its text field. Only the settings surface changes; the matching
rule, the catalogue and the prompt are untouched.

- [2-requirements.md](2-requirements.md) - problem, why names stay the search key, and the wildcard question

Not designed yet. The open question is where a one-command picker meets a
mechanism that needs patterns, since positional ids shift when a user reorders
their plugin configuration.
