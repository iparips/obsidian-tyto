---
created: 2026-09-18
updated: 2026-09-18
---

# An Answer Ends The Turn: Spec

A question answered from search is answered twice. The model calls answer_from_search, the answer reaches the panel with its sources, and the turn runs another step in which the model says the same thing again as text. The panel shows both blocks.

No tool can end a turn today. ToolCallOutcome (Engine) carries a refusal and an edit position, and carries no way to say the loop is over, so the tool result asks the model to stop talking and the model talks anyway. The observed turn shows it holding that instruction in context and restating regardless, which is why the change ends the turn on the call rather than wording the rule again.

The restating step also costs a step. A question answered by reading widely is the shape of turn that runs closest to the allowance, so ending on the answer returns a step where there is least room for it.

ask_user and choose_note keep running the turn. Both return something the next step acts on, where an answer returns nothing anyone can use.

- [2-requirements.md](2-requirements.md) - the duplicated answer, which tools are terminal and which only park, and the six scenarios
- [3-decisions.md](3-decisions.md) - D1 how the panel learns not to write a reply, D2 the new ending kind, D3 the calls beside the answer, D4 what the chat history keeps, D5 which of two answers ends it
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - six vault checks, since whether the model talks again is a judgement
- [design-ending-on-an-answer/1-index.md](design-ending-on-an-answer/1-index.md) - how a tool call stops the loop, how the kind reaches the panel, and how the answer text reaches the history
- [unit-tests/1-index.md](unit-tests/1-index.md) - the test plan, across four files that already exist
- [0-prompt.md](0-prompt.md) - the block handing the build to a fresh session
- [meta/1-index.md](meta/1-index.md) - the context audit: what the design phase read and where the tokens went
- [0-prompt-spec.md](0-prompt-spec.md) - the block that handed the requirements phase over, spent
- [0-prompt-design.md](0-prompt-design.md) - the block that handed the design phase over, spent

What the decisions add up to:

- The ending kind travels back beside the outcome, and the panel branches on it rather than on the outcome's shape (D1).
- A sixth TurnEndingKind, Answered, read by both the panel and the transcript (D2).
- Every call in the batch runs before the ending applies, so the chat history stays well-formed (D3).
- The history keeps the answer text, replacing the restatement it holds today (D4).

The design answers how a tool call tells the loop to stop, which nothing in ToolCallOutcome (Engine) can express today: the answer text rides back on the outcome, the executor holds it until the batch finishes, and the runner reads it after the stuck check.

One site the requirements did not name has to move with the enum. TranscriptTurnSection.answered (Session Transcript) keeps a turn's closing message for Replied and trims it for the other four, so Answered has to join Replied there or the transcript drops the answer the history just gained.
