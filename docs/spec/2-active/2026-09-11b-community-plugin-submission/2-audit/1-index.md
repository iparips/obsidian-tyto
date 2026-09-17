---
created: 2026-09-11
updated: 2026-09-17
---

# Audit Against the Guidelines

Tyto checked against the developer policies, the submission requirements, the
plugin guidelines, and the automated scan those three are now enforced by.
Verdict per rule, with the evidence in the repo.

- [2-blockers.md](2-blockers.md) - the one item that fails the automated review
- [3-disclosures.md](3-disclosures.md) - what the README must say and does not
- [4-review-comments.md](4-review-comments.md) - what the scan raises, each
  costing a round trip if left
- [5-passes.md](5-passes.md) - every rule checked and clean, plus two findings
  that are not guidelines
- [6-the-new-process.md](6-the-new-process.md) - what follows from submission
  moving to a dashboard and an automated scan, plus two defects found on the way

Twenty findings. One blocker, three disclosure gaps, six review comments, two
things that should not go out with a public repository, six that only the new
process raises, one wrong example in the docs, and one defect in this spec's own
build order.

Findings 1 to 12 were checked by hand against the documentation. Finding 13 is
that the repo does not run the linter which checks most of them, so the hand
audit is a snapshot rather than a gate.
