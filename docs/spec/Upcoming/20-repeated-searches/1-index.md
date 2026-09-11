---
created: 2026-09-09
updated: 2026-09-09
---

# Stopping a Repeated Search: Spec

A turn globbed the same pattern thirteen times, spent its twenty steps and
edited nothing. The harness stops a turn refused twice for one reason, but a
search that matches nothing is not a refusal, so nothing counted it.

The second failure on the utterance behind
[19-relative-dates](../../19-relative-dates/1-index.md). That one was a wrong date,
and it is fixed: the dates here are right. This is the turn failing to notice it
had already asked.

- [2-requirements.md](2-requirements.md) - the twenty-one steps, and why the existing counter does not fire
- [3-design.md](3-design.md) - the per-turn repository, and the refusal that reuses the existing loop guard
- [4-tasks.md](4-tasks.md) - build order in two commits

Not built.
