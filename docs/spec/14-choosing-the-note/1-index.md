# Choosing the Note: Spec

Replaces the yes/no confirmation with a choice. The model shortlists the notes
it found, the user picks one, and that pick is both which note and permission to
write to it.

A delta on [9-model-chosen-targets](../9-model-chosen-targets/1-index.md), whose
confirmation this retires. That design asked "open this one?" about a note the
model had already settled on, which answers consent and leaves identification to
the model.

- [2-requirements.md](2-requirements.md) - the problem, the one tool, and what each scope holds
- [3-component-design.md](3-component-design.md) - the picker, what replaces OpenApproval, and the two scopes
- [4-testing-strategy.md](4-testing-strategy.md) - unit test outline, branch by branch
- [5-implementation-order.md](5-implementation-order.md) - build order in two commits, and an exit test for each

Asking which note and asking whether to open it are one interaction, because the
answer to both is a path. Splitting them is what made a turn ask twice: once
through ask_user to disambiguate, once through the confirmation to consent.

The scopes separate. A note the model found stays found for the session, since
finding is knowledge and does not expire. A note the user chose is chosen for
the turn, since consent is about the write in front of them rather than every
future write to that note.

Not started. Depends on the SeenPaths and open-budget fixes already in
[10-finding-notes](../10-finding-notes/1-index.md)'s wake.
