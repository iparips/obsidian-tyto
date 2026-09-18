---
created: 2026-09-18
updated: 2026-09-18
---

# A Transcript That Diagnoses: Unit Tests

One entry per production method the design changes. The checks a person runs by hand live in [../4-acceptance-criteria.md](../4-acceptance-criteria.md), and the prompt change is tested against a real vault per [../design-a-transcript-that-diagnoses/7-testing-and-rollout.md](../design-a-transcript-that-diagnoses/7-testing-and-rollout.md).

- [2-the-provider-boundary.md](2-the-provider-boundary.md) - MistralMapper both ways, ChatTurn, and the restore path
- [3-the-charge.md](3-the-charge.md) - IterationCounter's two new readers, and what a step records
- [4-the-response-block.md](4-the-response-block.md) - what a step's response block renders, and the three empty cases
- [5-repeats-and-the-document.md](5-repeats-and-the-document.md) - the repeat mark, and the document-level cases
- [6-the-builders.md](6-the-builders.md) - the blast radius, and the sibling builder that keeps it at zero

Four suites already cover this ground and gain cases rather than being replaced.

| Suite                                                      | Covers                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| src/model/providers/tests/mistral-mapper.test.ts           | fileNameFor alone today, so both directions are new coverage |
| src/session/transcript/tests/transcript-document.test.ts   | What the document renders                                    |
| src/session/transcript/tests/transcript-repository.test.ts | What a step records                                          |
| src/engine/tests/iteration-counter.test.ts                 | The charge                                                   |
