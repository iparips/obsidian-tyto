---
created: 2026-09-18
updated: 2026-09-18
---

# Design: Searching For A Misheard Name

Let a turn work with a name the transcriber guessed wrong. A grep returns every match in a matched note rather than the first, the prompt states that a spoken name is approximate and how to answer a question from what was read, and a turn that searches fruitlessly or runs out of context ends by saying so.

- [2-what-a-search-returns.md](2-what-a-search-returns.md) - what a hit becomes, the payload arithmetic, how the report renders a block, and why MAX_HITS drops to six
- [3-endings-and-the-prompt.md](3-endings-and-the-prompt.md) - the empty-search guard, what the harness knows at overflow, the four prompt rules, and the fixture re-record
- [4-behaviour.md](4-behaviour.md) - the comparison table and the one sequence diagram carrying both new endings
- [5-new-interfaces-search.md](5-new-interfaces-search.md) - every type the change adds or alters under src/search
- [6-new-interfaces-engine.md](6-new-interfaces-engine.md) - the guard, the two endings, the continuation prompt and the overflow recogniser
- [7-scope-and-rollout.md](7-scope-and-rollout.md) - what is left out, the files the shipped tag tool already changed, the commit order and the references

The unit-test plan is [6-unit-tests.md](../6-unit-tests.md), beside the design rather than inside it.

No feature flag and no gating section: this repo has no flag registry, so both would be invented rather than found. No logging section either, since the repo has no logging layer and the panel's progress lines are what a turn narrates with.

## The two calls worth reading first

The shape of a grep result is the one that decides answer quality, which is what D4 turns on. A hit trades its single 200-character excerpt for a list of line-range excerpts, merged where their windows touch, and MAX_HITS drops from ten to six because a row now costs a block rather than a line. The arithmetic is in [2-what-a-search-returns.md](2-what-a-search-returns.md).

The second is what the harness can know once the model call itself has failed. The continuation prompt is built by TurnEndingService (Engine) from the utterance and the notes read, both turn-scoped, and deliberately not from the session-scoped paths a search returned or from the progress lines, which are published one way and cannot be read back. That is [3-endings-and-the-prompt.md](3-endings-and-the-prompt.md).

## Where the spec was wrong

Two claims the code disagreed with, corrected in the design rather than worked around. Both are stated in full in [3-endings-and-the-prompt.md](3-endings-and-the-prompt.md) and [7-scope-and-rollout.md](7-scope-and-rollout.md).

- The design prompt names three files the tag-tool spec also touches. Only tool-schemas.ts is one it wrote; it read the other two as precedent. Two files it did write went unnamed. Its merge confirms this.
- The requirements place the empty-search guard at ConversationTurnRunner.isStuck alone. The guard needs a fact from the tool layer that nothing carries today, so it is four files rather than one.
