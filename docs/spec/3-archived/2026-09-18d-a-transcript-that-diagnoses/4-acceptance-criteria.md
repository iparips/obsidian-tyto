---
created: 2026-09-18
updated: 2026-09-18
---

# A Transcript That Diagnoses: Acceptance Criteria

The check is a person copying a transcript of a turn that went wrong and finding the cause without reading the code. Each check names a turn to provoke, and passes when the reader gets there from the document alone.

Five checks, down from six. The applicable_skills check came out when D4 closed on leaving the declaration in the call's JSON, which is where the transcript already renders it.

The reader in each check has not read the plugin source. They have the transcript and the note.

## Setup

- A vault with at least one markdown note, a tag on at least one other note, and a skill defined under the skills path
- A configured API key, and search enabled
- The panel open, with a note as the session's target

### A tag spliced mid-sentence is traced to the call that spliced it

```gherkin
Given a turn that inserted a tag into the middle of a sentence rather than at the end
When  a reader copies the transcript and reads the turn
Then  they can name the step whose call carried the wrong anchor
And    they can say what the note held at that step, and what the model was told it held
```

The likely cause a reader should reach is the note context the step was sent, which the appendix diffs per step. A reader who cannot get past the progress lines has a transcript whose steps do not say which call wrote what.

### An applied edit reported as no edit is traced to the tool result

```gherkin
Given a turn whose edit reached the note and whose reply said no edit was made
When  a reader copies the transcript and reads the turn
Then  they can see the edit succeeded in the step that applied it
And    they can see what the model was sent afterwards that led it to say otherwise
```

Both halves have to be there. The first is the harness's record of the call; the second is the model's own words on the step that ended the turn, which is the case that rendered "nothing recorded".

### A turn that ran out of steps says where the budget went

```gherkin
Given a turn that ends with the message that it ran out of steps
When  a reader copies the transcript and reads the turn from the top
Then  they can say which steps cost the most without adding up the calls themselves
And    the last step's total agrees with the number the ending message names
```

A reader who reaches for a calculator has the defect this check exists for. The number they need is on the step.

### A turn that looped on one call reads as a loop

Run this one twice, on two turns, since the mark means nothing unless it holds on both.

```gherkin
Given a turn in which the model sent the same call with the same arguments three times, each returning nothing
When  a reader scrolls the turn
Then  the second and third are marked as repeats of the first

Given a turn that greps a pattern, gets nothing, writes the pattern into the note, and greps again
When  a reader scrolls the turn
Then  neither grep is marked as a repeat
And    the reader reads the second grep as confirming the write
```

Scrolling is the operative word. The mark has to work for a reader skimming, since the original cost was a repeat that read as progress. The second turn is what says the mark means something: a transcript marking it would report the step that did the most work as the step that went nowhere.

### A model that spoke is never reported as silent

```gherkin
Given any turn of any ending, including one that ran out of steps
When  a reader reads every step of the transcript
Then  no step claims nothing was recorded where the panel showed the model speaking
And    a step that reached no model says the provider call did not return
```

The one check to run against a turn that went fine as well as one that went wrong. A transcript that misreports silence is the failure this spec exists for, and it is cheapest to catch on a turn whose panel the reader still has open beside them.

The second line is the case design found: a step whose provider call failed says so, rather than reporting the model as having recorded nothing. Provoke it by breaking the API key mid-session, which fails the next step's call without ending the session.
