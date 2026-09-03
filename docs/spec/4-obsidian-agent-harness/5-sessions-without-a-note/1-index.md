# Sessions Without a Note: Spec

Lets a session start with no note open. Today the command refuses, because the
session was built when editing one bound note was all the plugin did.

A delta on [1-harness-mvp](../1-harness-mvp/01-index.md), which gave the plugin
a search flow that needs no bound note at all. The refusal is a leftover from
before that flow existed.

- [2-requirements.md](2-requirements.md) - what an unbound session can and cannot do
- [3-component-design.md](3-component-design.md) - the nullable binding, and where it is resolved
- [4-testing-strategy.md](4-testing-strategy.md) - unit test outline
- [5-implementation-order.md](5-implementation-order.md) - the build sequence and the exit test

A session starts unbound and binds to the first note the user opens, through the
active-note wiring that already exists. Search and questions work immediately;
an edit says no note is open rather than failing obscurely.

Designed, not built.
