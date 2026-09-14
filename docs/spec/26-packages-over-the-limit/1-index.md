---
created: 2026-09-14
updated: 2026-09-14
---

# Packages Over The Limit: Spec

Four folders hold more than the ten files the architecture allows. Each has been
over for a while, and
[architecture/7-package-design.md](../../architecture/7-package-design.md) says
so in its own size table: "Each is a split waiting to be specified, not a reason
to raise the limit."

This is that specification. Three folders split by concept, one by kind, and the
rule deciding which is the code-generation skill's: group by subdomain, and give
a subdomain kind folders only once it outgrows the limit as one thing.

- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it
- [2-requirements.md](2-requirements.md) - what is over, by how much, and what may not change
- [3-design.md](3-design.md) - the four splits, and why each takes the shape it does
- [4-tasks.md](4-tasks.md) - build order in five commits, four folders and the architecture doc

Built.
