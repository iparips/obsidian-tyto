---
created: 2026-09-17
updated: 2026-09-18
---

# Acceptance Criteria

Every check here is a judgement about what the model does across a whole turn, which the unit suite cannot make. The suite asserts that a second retargeting call is refused, for both commands and open_note, and that the first note stays reachable; whether the model then interleaves its opens and edits, and whether the turn writes all three notes, is what a person has to watch.

## Setup

- A real vault and a real API key, per CLAUDE.md on prompt changes
- A weekly folder holding a todo, a shopping list, and today's daily note
- Commands that open each of the three, in the allow-list
- Today's daily note empty, which is how its command creates it

### A turn naming three notes writes to all three

```gherkin
Given a vault with a todo, a shopping list and an empty daily note
When  the user says one utterance adding an item to each of the three
Then  each of the three notes holds its new item
And   the turn ends with a summary rather than an error
```

### The model opens one note at a time

```gherkin
Given the same utterance naming three notes
When  the turn runs
Then  no step retargets twice
And   the panel shows each open followed by the edit that belongs to it
```

A step that retargets twice means the refusal is not reaching the model, or the prompt still reads as an instruction to plan the whole turn up front.

### An anchor refusal says which note it reached

```gherkin
Given a turn whose target has moved to the daily note
When  the model sends an edit anchored to text only the shopping list holds
Then  the refusal names the anchor's first line and the daily note's path
```

Landed in a777c0b. Kept here because it is what tells the model the anchor was right and the note was wrong, which is the behaviour this spec depends on.

### An empty daily note is written rather than re-read

```gherkin
Given today's daily note is empty
When  the user says to add a line to it
Then  the note holds the line
And   the panel shows one read of it, not a run of them
```

Landed in 79e505c. A run of identical reads means the empty-note message is not reaching the model, or it is being read as a failure.

### The turn stays well inside its step budget

```gherkin
Given the same utterance naming three notes
When  the turn ends
Then  it used fewer than twelve steps, counting neither a skill-gating refusal,
      nor the load_skill that answers it, nor the call it forced to be repeated
```

The interleaved shape costs about six against a cap of twenty. Near the cap means the model is retrying something rather than progressing, and the panel's step list says what.

Skill gating is excluded because it is not this spec's cost. A note whose skill has not been read costs three steps before any work happens: the refusal, the load, and the re-run. Those three would be spent reaching the same note in a turn of its own, so counting them measures how many skills the utterance touched rather than whether the turn progressed.

## The three-note baseline

Run on 2026-09-18, mistral-medium-latest, against the real vault. One utterance naming a shopping list, a todo and today's daily note. All five checks pass.

| Measure                     | Observed |
| --------------------------- | -------- |
| Notes named                 | 3        |
| Notes written               | 3        |
| Steps, total                | 15       |
| Steps, excluding gating     | 6        |
| Steps that retargeted twice | 0        |
| Refusals from the new guard | 0        |

Six steps excluding gating is what the design predicted. The other nine are three skills at three steps each: a refusal, a load_skill, and the run_command repeated.

The guard never fired, which is the outcome the rollout was watching for. The model reached one note, edited it, then reached the next, without the prompt line. That is what settles commit 2: the refusal was never needed, so the line that would save a wasted step has no wasted step to save.
