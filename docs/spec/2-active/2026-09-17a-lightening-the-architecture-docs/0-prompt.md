---
created: 2026-09-17
updated: 2026-09-17
---

# The Prompt

The block to hand a fresh session that will design and build this.

```text
Design and then build the spec in
docs/spec/2-active/2026-09-17a-lightening-the-architecture-docs. It rewrites
docs/architecture: 13 release-shaped files become 7 subsystem-shaped ones.

Read 1-index.md, 3-requirements.md and 4-decisions.md; all three decisions are
settled, and D1 tables which packages each of the seven files covers.
5-acceptance-criteria.md holds the checks.

Then read all 13 files in docs/architecture before writing anything: the design
decides what survives, so it cannot come from the index alone. Write 6-design.md
saying where each file's content lands, then 7-tasks.md, then build it.

Repo conventions are in AGENTS.md. Read
docs/architecture/12-the-panel-vocabulary.md early: it is already
subsystem-shaped and is the model for the other six.

The brief is lightweight. A subsystem file holds one diagram and the boundaries
a reader cannot grep: why something sits where it does, what is deliberately
absent, which rule is positional. It does not hold what src says plainly. The
test for a sentence is whether a reader with the code open still needs it.

Verify two claims. Releases 1 to 4 are said to be shipped and 5 to 7 unbuilt:
check docs/plan/1-index.md against 1-upcoming. And 16 of the 30 references into
the folder are said to point at 7-package-design.md, which is what makes its
removal the risky one. Every one of those 30 must still resolve when you are
done, so script that check rather than reading for it.

Two things the spec does not say: load the mermaid skill before drawing, and the
six existing diagrams are the folder's most valuable content, so prefer
redrawing from them over inventing new ones.

If the spec is wrong, fix the spec and say what changed rather than building
around it.
```
