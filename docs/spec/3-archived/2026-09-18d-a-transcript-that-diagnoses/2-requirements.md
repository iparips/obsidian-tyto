---
created: 2026-09-18
updated: 2026-09-18
---

# A Transcript That Diagnoses: Requirements

## Why

Eight defects were diagnosed from Tyto transcripts on 2026-09-18, and the transcript was what made all eight findable. Each cost the session time in the same way: the record held the evidence, and the reader had to reconstruct it.

Two of those costs are the record being wrong rather than terse. A step whose reply carried text alongside tool calls renders the calls and drops the sentence, with nothing to say a sentence was there. A step whose provider call failed renders "nothing recorded", which reads as a claim about the model where it is a fact about the harness. Both were reproduced against the current code on 2026-09-18, and neither mechanism is the one earlier notes recorded.

A transcript that says nothing was recorded where the model spoke is worse than a terse one. A reader who trusts it reasons from an absence that the harness invented, and a reader who does not trust it stops using the document for what it is for.

The rest are the record being true and hard to read: an empty search result that does not say why, an identical call repeated with nothing marking it, and a step budget invisible until it runs out. Two more were raised and neither earned a change: applicable_skills renders in the call JSON already, and the prompt version misleads across transcripts rather than within one.

## Who The Transcript Is For

A model reading it as pasted context, and a person reading it beside the panel. Both at once, and the model is the more common of the two.

That settles the shape of every line this spec adds. A line earns its place by changing what a reader concludes, not by being available. A model pays for every line in context it could spend on the note bodies and tool results the transcript already carries, so a line that restates what the step below it shows is a cost with no return.

Where the two readers disagree, the model wins. A person has the panel, the vault and the code beside them; a model pasted a transcript has the transcript.

## What The Transcript May Grow By

A transcript already carries full note bodies, full tool results and the note context diffed per step. Those are the payload, and nothing here touches them.

The budget for this spec is per step, not per transcript, because a turn that went wrong is a long turn. Two of the six additions render on every step of every turn, so a line that costs two is twenty on a turn that spent ten steps.

- One line per step, and one only. The budget line takes it (D2), so where a repeat mark or a skill declaration also fires on a step, they share that line rather than adding a second.
- Every other addition renders only on a step it says something about. A step that sent one call has no repeat to mark, and writes no line saying so.
- Nothing added restates what the step already shows. A count of calls the step lists is a restatement; the charge those calls drew is not.

The budget line is the one thing here that renders on a step that went fine, which D2 took deliberately. It is what lets a reader watch the total climb rather than discover it at the ending.

## In Scope

### The model's own words, recorded as the model said them

A turn step renders every part of the model's reply that reached the harness: its text, its tool calls, or both. A reply carrying text and calls renders both, in the response block, under the step that sent them.

A step whose reply was genuinely empty says that, and says it as itself. Text the harness dropped, a reply that carried nothing, and a provider call that never returned are three different facts, and "nothing recorded" is currently the wording for all three.

Two mechanisms produce the symptom today, verified against the code on 2026-09-18 and both in scope.

- ChatMessage.modelToolCalls (Model Providers) takes only the calls, and MistralMapper.toChatTurn (Model Providers) builds a ChatTurn of calls or of text and never of both. A reply carrying both loses its text at the provider boundary, before the transcript sees it, and the transcript renders the calls alone with no marker.
- A step whose provider call failed appended nothing to the history, so its slice is empty and TranscriptTurnStep.response (Session Transcript) renders "nothing recorded". The harness never reached the model, and the wording blames the model for the harness's own failure.

The second is the transcript's own, and it is a wording fix rather than a slice fix: the step really did record nothing, and what it has to say is why. The first is upstream of the transcript, and fixing the transcript alone cannot recover text the history never held, so both are fixed here and ship together (D1).

What this requirement does not rest on, corrected during design. TranscriptTurnSection.answered (Session Transcript) truncates the tail at the last model note, and an earlier reading had that emptying the slice on Exhausted and Stuck. It does not. Exhausted, Stuck and Failed append nothing to the history at all, since TurnOutcomes builds the first two and Failed returns without writing, so the truncation finds no model note to cut at and leaves the tail whole. It fires on Cancelled alone, where it does what it was written to do: drop the harness's closing note and keep the model's own words. A realistic exhausted turn renders its last step's tool calls today.

The sibling spec 2026-09-18c added a sixth ending and read the same distinction from the other side. TranscriptTurnSection.closesWithTheModelsOwnWords (Session Transcript) now exempts Replied and Answered from the truncation, since those two are the endings that close the tail with the model's own words.

Carrying the text through is symmetric. MistralMapper.toApiMessage (Model Providers) also hardcodes content to empty on a message carrying tool calls, so a text kept in the history would still be stripped on the way back to the model. The model therefore reads its own last reply in full on the next step, which is a behaviour change and is tested as one.

### An empty result that says why it was empty

A search that returned nothing renders the reason the harness gave for it, where there is one. SearchReport (Search) already names an unreadable brace list, an unclosed character class, a folder-shaped pattern and the narrowing a grep searched, and that reason reaches the transcript inside the tool result the next step's request block carries.

So the requirement is that the transcript does not lose it, and does not restate it. Where the reason a reader needs is already in a tool result the transcript renders, the transcript adds no line of its own.

### A verbatim repeat, marked where it happens

A tool call identical to one an earlier step of the same turn sent, in name and in arguments, and which returned what that one returned, is marked as a repeat at the point it recurs. The mark names which step it repeats.

The result is part of the test because the turn can change what the call reads (D3). A grep that missed, a write, and the same grep hitting is one turn doing its job, and marking the second grep would report the step that did the most work as the step that went nowhere.

This spec makes the loop visible and does not make it stop. A guard that refuses the repeat is the sibling spec named in Out of Scope, and the two are different work: a marked repeat tells a reader the turn looped, where a guard would mean the turn never got that far.

### The step budget, readable before it runs out

Every turn step names what the turn has spent of its budget and what the budget is. A reader scrolling a turn sees the total climb, so a turn that ends exhausted ends on a number the steps before it were already approaching.

What a step costs is no longer its call count. IterationCounter (Engine Turn Spending) charges one for the round-trip and half for each call after the first in a reply, accumulates fractionally, and rounds only when the total is read. A budget line that showed a call count would therefore be wrong in the direction that caused the original detour: the hand-tally that took the session time counted calls, and calls are not what is charged.

So the line says the charge, and a step whose charge and call count differ is where a reader most needs it. The running total is rounded as the counter rounds it, once when read, so the last step's total is the number the exhausted message names rather than a sum a reader could dispute.

### What the model declared it was covered by

Nothing changes here, which is how D4 closed. applicable_skills is a per-call argument: ToolCatalogue.buildSchemaDeclaringSkills (Engine Tools) adds it to each guarded schema as a required property, the model declares once per call, and the transcript renders it inside that call's JSON. The declaration is a property of the call, so that is where it is read from.

Three defects came down to a model declaring [] and the gate accepting it, and each took a third read of the transcript to spot. That is a cost of skimming a JSON block rather than of the record missing anything, and the transcript already permits reading it. Promoting it to the step would duplicate the value on every guarded call and spend the per-step line allowance on a claim sitting two lines below.

What this preserves is the distinction the gate turns on. A declared [] and an omitted argument are different claims: the argument is required, so an omission is refused where an empty list passes. The JSON renders the difference exactly, since an omitted argument simply is not there.

### A prompt version that means one prompt

Two transcripts of two runs both cite system prompt v1 and mean different text where the prompt was edited between them. The version is per transcript by construction: TranscriptRepository.versionOf (Session Transcript) numbers from one per session.

A transcript carries enough for a reader to tell whether two transcripts cite the same prompt text. What that is, and whether the cost is worth paying, is the open decision D5.

## Out Of Scope

The harness behaviour these defects revealed. Both are unfixed, neither has a spec folder yet, and each is its own.

- The applicable_skills gate taking the model's word. SkillDeclarationChecker (Engine Skill Gating) accepts a declared [] as a claim that no skill covers the utterance, and nothing checks the claim against the vault's skills. Marking the declaration in the transcript makes a wrong one findable and does not make it refused.
- A repeated identical call having no guard. RepeatedRefusalCounter (Engine Turn Spending) counts by refusal reason, so a call that succeeds and returns nothing never reaches it, and a turn can send the same call until the budget stops it.

Also out.

- The panel. A reason that helps the model mid-turn belongs in the tool result, which is where SearchReport already puts it, and the panel's own width limits are a separate question from the transcript's. Nothing here changes what the panel shows.
- The size of the step budget, and what a call is charged. Both settled in the archived spec 2026-09-18b-charging-a-batch-of-calls, and this spec reports the charge rather than changing it.
- The stale comment on MAX_ITERATIONS (Engine Turn Spending), which still says the allowance is counted in tool calls. True before 103e1df and not after. Worth correcting, not here.

## Scenarios

### A reply carrying text and tool calls renders both

Given a turn step whose reply carried a sentence and two tool calls
When the transcript is read
Then the step's response block holds that sentence and both calls

### A step whose provider call failed says the harness never reached the model

Given a turn step whose provider call failed before the model answered
When the transcript is read
Then the step's response block says the provider call failed
And no step of that turn claims the model recorded nothing

### A step that returned nothing says so as itself

Given a turn step whose reply carried neither text nor tool calls
When the transcript is read
Then the step's response block says the reply was empty, not that nothing was recorded

### A repeated call is marked where it recurs

Given a turn whose third step sent a call identical in name and arguments to its first step's, and got back what the first got back
When the transcript is read
Then the third step's call is marked as repeating step 1
And the first step's call carries no mark

### A call the turn changed the answer to is not a repeat

Given a turn that grepped a pattern, wrote the note, and grepped the same pattern again
When the transcript is read
Then neither grep is marked as a repeat

### A step names what the turn has spent

Given a turn whose first reply batched four calls
When the transcript is read
Then the first step names a charge below four and above one
And the second step names a running total that includes it

### A turn that ends exhausted ends on the number it was climbing to

Given a turn that ended exhausted
When the transcript is read
Then the last step's total equals the budget the ending message names

## References

Open first.

### Task

- `src/session/transcript/transcript-turn-step.ts` - response() renders "nothing recorded" on an empty slice, which is the whole of the transcript's half of the symptom; request() renders the tool result carrying a search reason
- `src/engine/turn/ending/turn-outcomes.ts` - open beside turn-ending-service.ts: Exhausted, Stuck and Failed write nothing to the history, which is why the last step of an exhausted turn renders its calls and why an empty slice means the provider failed. Six endings now, since 2026-09-18c added Answered
- `src/model/providers/models/chat-message.ts` - modelToolCalls() takes calls and sets content to empty, so a reply's text is lost before the transcript sees it
- `src/model/providers/mistral-mapper.ts` - toChatTurn() returns calls or text and never both, which is where the loss starts
- `src/session/transcript/transcript-repository.ts` - what a step records, and versionOf() numbering prompt parts from one per session
- `src/engine/turn/spending/iteration-counter.ts` - the budget, the fractional charge, and what a batch costs
- [3-decisions.md](3-decisions.md) - five open decisions, two blocking

### Project

- [../../3-archived/2026-09-18b-charging-a-batch-of-calls/2-requirements.md](../../3-archived/2026-09-18b-charging-a-batch-of-calls/2-requirements.md) - open before writing the budget line: what a step costs, and why a call count is the wrong number to show
- [../../3-archived/2026-09-18a-searching-for-a-misheard-name/2-requirements.md](../../3-archived/2026-09-18a-searching-for-a-misheard-name/2-requirements.md) - open when judging whether a search reason needs more than the tool result carries

### Architecture

- [../../../architecture/2-vocabulary.md](../../../architecture/2-vocabulary.md) - open first: a turn, a turn step and a progress line are three things and the transcript renders all three
- [../../../architecture/4-the-turn.md](../../../architecture/4-the-turn.md) - open when the budget line needs the six endings and where each is recorded
