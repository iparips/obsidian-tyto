---
created: 2026-09-07
updated: 2026-09-11
---

# Session Persistence: Spec

Keeps a session across a backgrounded app. Mobile evicts the WebView while the
user is elsewhere, and Owl comes back with an empty panel and a model that has
forgotten the conversation.

A delta on [7-sessions-without-a-note](../7-sessions-without-a-note/1-index.md),
which defined what a session holds. That design assumed the session lives as
long as the plugin does, which is true on the desktop and false on a phone.

- [0-prompt.md](0-prompt.md) - the block handed to a fresh agent that will build it
- [2-requirements.md](2-requirements.md) - what is lost, what must survive, and what must not
- [3-component-design.md](3-component-design.md) - the record, who writes it, and when, and a map of the subsystem
- [4-testing-strategy.md](4-testing-strategy.md) - unit test outline, branch by branch
- [5-implementation-order.md](5-implementation-order.md) - build order in two commits, and an exit test for each

The basic version, deliberately. One session, restored on load, discarded on
reset. Not a history of past sessions, not a session per note, and not a
resumable turn: a turn interrupted mid-flight settles as interrupted, because
the request that was in the air is gone and cannot be rejoined.

Two facts make this small. The session is already two values behind one
repository, and the panel is already a reducer over a list of entries. Neither
holds a collaborator, so both serialise without untangling anything.

The transcript is the one thing left behind. It holds every prompt and note
excerpt a turn sent, which is too much to put on disk, so a restored session
copies a thinner transcript than one that never went away.
