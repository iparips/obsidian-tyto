---
created: 2026-09-18
updated: 2026-09-18
---

# Prompt: Spec A Transcript That Diagnoses

Hands the requirements phase to a fresh session. The spec folder holds only this
file, so the prompt carries the evidence: it comes from a day spent diagnosing
eight real defects out of panel transcripts, and what that session learnt about
where the transcript helped and where it got in the way dies with it.

Spent once `2-requirements.md` and `3-decisions.md` land. Keep it as the record
of what the phase was asked for.

```text
Write the requirements for improving Tyto's session transcript, so the next
defect is diagnosed from it rather than around it.

The spec folder exists and holds only this prompt:
docs/spec/2-active/2026-09-18d-a-transcript-that-diagnoses

Read CLAUDE.md first, then docs/architecture/2-vocabulary.md before naming
anything: a turn, a turn step and a progress line are three different things and
the transcript renders all three.

Load the sdd skill and follow its Write Requirements workflow. Requirements and
decisions only. Write no design, and change nothing under src.

## Where this comes from

On 2026-09-18 a session diagnosed eight defects in Tyto from copied panel
transcripts: a turn that ended on a statement of intent, invented tags, a
heading read as a tag, an applied edit reported as "no edit was made", a tag
spliced mid-sentence, a glob that matched brackets literally, a skill that never
loaded, and a turn that exhausted its budget with the answer in hand.

The transcript was what made all eight findable. It is already good: it cites
prompt parts by version rather than repeating them, diffs the note context
between steps, chains a step's Harness block into the next step's Request, and
puts skill bodies in an appendix. None of that needs revisiting.

What follows is where it cost that session time. Each is a real detour, not a
wish list.

## The defects in the transcript itself

### A model's own words recorded as "nothing recorded"

The first transcript of the day rendered:

    Response from model
    - nothing recorded

while the panel showed the model saying "To tag this note, I need to check the
vault's tagging strategy. Let me look up the relevant information." The text
existed. The transcript dropped it, and the reader had to reconstruct it from
the Reply line further down. It recurred in four later transcripts, always on
the step that ended a turn.

Traced, 2026-09-18:

- src/session/transcript/transcript-turn-step.ts, response(): reads the model's
  answer off the chat-history slice rather than a stored copy, deliberately, so
  the two cannot disagree. Empty slice renders "nothing recorded".
- src/engine/turn-ending-service.ts:30: a turn ending on text appends that text
  to the session history.
- src/session/transcript/transcript-repository.ts, closeOpenStep() and
  closedAt(): the last step's range is extended when the transcript is read, but
  only its progress-line range. The history range is left where recordCall put
  it, so a message appended after that call falls outside the step that produced
  it.

That is the mechanism as this session read it. Verify it before building on it.

This is the one worth doing even if nothing else is: a transcript that says
nothing was recorded where the model in fact spoke is the only case where the
record actively misleads.

### An empty result that does not say why it was empty

Six calls in one turn sent path patterns holding a character class, matched them
literally, and returned "nothing matched". Neither the panel nor the transcript
said the brackets were the problem, so the model rewrote the folders around them
six times.

The harness half is fixed (e86378a, e07cc7b: a miss now names the narrowing it
searched, and an unreadable brace list, an unclosed class or a folder-shaped
pattern says so). The question for the
requirements is whether the transcript should carry a fuller reason than the
panel does, since the transcript is where a defect is diagnosed after the fact
and has no width limit to respect.

### A repeated identical call that reads as progress

Three transcripts carried the same tool call, arguments and all, two or three
times in a row. Scrolling past it, it reads as a turn making progress. Marking a
verbatim repeat would make a loop visible, and is formatting over data the
transcript already holds.

Note the harness cannot yet detect this: RepeatedRefusalCounter counts refusals
by reason, and a call that succeeds and returns nothing is not a refusal. Making
the transcript show it is not the same as making the loop stop, and the
requirements should say which of the two this spec is.

### The step budget, invisible until it runs out

A turn ended with "ran out of steps for this turn after 20" after eleven steps.
Working out why took hand-tallying the calls per step: six of those steps had
sent two to four calls each, and each call was charged one. The transcript
showed the calls and never the running total.

That charging has since changed (103e1df: a call after the first in a reply
costs half, spec archived under 3-archived/2026-09-18b-charging-a-batch-of-calls).
Read that spec before writing this part: what a step costs is no longer its call
count, so a budget line has to say what it now means.

### applicable_skills, buried in the arguments

The single most diagnostic field for a whole class of failure, and it sits
inside each call's JSON. Three separate defects came down to a model declaring
[] and the gate accepting it, and each took a third read of the transcript to
spot. Whether it belongs at step level is a decision, not a given: it is already
in the record, and duplicating it has a cost.

### A prompt version that means two different prompts

The transcript versions the prompt parts, so a repeated step cites "system
prompt v1" rather than repeating it. That works within one transcript. Across a
session where the prompt is being edited between runs, two transcripts both say
v1 and mean different text. This session twice came close to comparing runs that
were not comparable.

Whether the fix is a hash, a plugin build stamp, or nothing at all is the
decision. Note the cost: anything that changes per build makes two transcripts
of the same code differ, which matters if transcripts are ever compared as
fixtures.

## Questions the requirements have to settle

1. Which of the six are in scope. Do not assume all of them. The first is worth
   doing alone; the rest are worth what they cost, and the requirements are
   where that is argued.
2. Who the transcript is for. It is copied out of the panel and pasted to an
   agent, so its reader is a model as often as a person. A line that helps one
   may cost the other context, and the answer shapes every question below.
3. What the transcript may grow by. It already carries full note bodies and tool
   results; several of these add lines to every step. Say what the budget is.
4. Whether any of this is the panel's job too. The panel is read live and the
   transcript after the fact, and a reason that helps the model mid-turn belongs
   in the tool result rather than in either.

## Scope

In: what the transcript records and renders. Out: the harness behaviour these
defects revealed. Two of those are unfixed and each is its own spec - the
applicable_skills gate taking the model's word, and a repeated identical call
having no guard. Name them, leave them out.

## Acceptance criteria

The honest check is a person copying a transcript of a turn that went wrong and
finding the cause without reading the code. Write it that way rather than as an
assertion about a string, and pick a real case: the tag spliced mid-sentence and
the applied edit reported as no edit are both good ones.

## If the evidence is wrong

Every code claim above was read on 2026-09-18 by a session that kept working in
the same checkout afterwards, including in the transcript package. Check each
before building on it, and if a line has moved or a name has changed, correct
the requirements and say what you corrected rather than writing around it.
```
