---
created: 2026-09-18
updated: 2026-09-18
---

# A Transcript That Diagnoses: Spec

Eight defects were diagnosed from Tyto transcripts on 2026-09-18, and the transcript was what made all eight findable. Six things about it cost that session time, and this spec is which of the six to fix.

Two are the record being wrong rather than terse, and both were reproduced against the current code. A reply carrying text alongside tool calls loses the text before the transcript sees it. A step whose provider call failed renders "nothing recorded", which reads as a claim about the model where it is a fact about the harness.

The other four are the record being true and hard to read: an empty search result, a repeated identical call, the step budget, and applicable_skills in call JSON. A seventh is the prompt version meaning two prompts across two transcripts.

Four of the seven change the code. Three close as no change, and the design says why for each rather than leaving them as gaps.

- [2-requirements.md](2-requirements.md) - who the transcript is for, what it may grow by, the six additions and the seven scenarios
- [3-decisions.md](3-decisions.md) - all five resolved: the text is carried through, the budget is on every step, a repeat is same call and same result within one turn, applicable_skills stays in the call's JSON, and the prompt version gains nothing
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - five checks, each a reader finding a cause from the document alone
- [design-a-transcript-that-diagnoses/1-index.md](design-a-transcript-that-diagnoses/1-index.md) - what changes and what does not, the sequence, the new signatures, and how the prompt change is tested
- [unit-tests/1-index.md](unit-tests/1-index.md) - the test plan, against the four suites that already cover this ground
- [meta/1-index.md](meta/1-index.md) - the context audit: what the design phase read, what each read decided, and what to change
- [0-prompt.md](0-prompt.md) - the prompt handing the build to a fresh session
- [0-prompt-design.md](0-prompt-design.md) - the prompt that handed the design phase over, kept as the record of what it was asked for
- [0-prompt-spec.md](0-prompt-spec.md) - the prompt that handed this requirements phase over, kept as the record of what it was asked for

The design is written and every decision is closed. D1 carries the reply text through ChatTurn and ChatMessage rather than marking it lost, so this spec reaches outside the transcript package and changes what the model is sent on the next step: a behaviour change under the repo's own prompt rule, tested against a real vault. The release 3 fixture was checked and is unaffected, since it compares the system prompt alone and D1 changes an assistant message in the history.

D2 puts the running total and the budget on every step, which is what a recorded step then has to hold. D3 makes a repeat the same call returning the same result within one turn, since a turn can change what a call reads and marking a grep that confirmed a write would report the busiest step as the emptiest.

D4 closed on leaving applicable_skills in the call's JSON, where it already renders: it is a property of the call, and promoting it would move a value away from the thing it describes. D5 closed on nothing, since the appendix already writes every part's full text and two transcripts are compared by diffing it.

One requirements claim was wrong and was corrected rather than designed around. The "nothing recorded" symptom is not TranscriptTurnSection.answered's truncation. Exhausted, Stuck and Failed append nothing to the history, so that truncation finds no model note and cuts nothing; it fires on Cancelled alone, correctly. The symptom's one remaining path is a step whose provider call failed, and the design names that case rather than blaming the model for it.

Two harness defects are named and left out, and neither has a spec folder yet: the applicable_skills gate taking the model's word, and a repeated identical call having no guard.
