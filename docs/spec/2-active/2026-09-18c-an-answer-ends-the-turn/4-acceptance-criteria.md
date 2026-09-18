---
created: 2026-09-18
updated: 2026-09-18
---

# An Answer Ends The Turn: Acceptance Criteria

Six checks. The suite can prove the loop stops on the call. What it cannot prove is that a real model, given a real question, now leaves the answer alone. These are the checks a person runs.

## Setup

- A real vault and a real API key, per the repo's rule that a behaviour change is tested against both
- Search enabled in settings
- Three weeks of notes carrying a shared tag, enough that a themes question needs several of them
- No note open, so the session is unbound and the turn must search

### A question answered from search shows one answer and no reply

```gherkin
Given no note is open
When  the user asks for themes across three weeks of tagged notes
And   the model searches, reads notes and calls answer_from_search
Then  the panel shows one answer block with its sources
And   the panel shows no assistant reply under it
And   the panel returns to idle without a further step
```

This is the turn from the requirements and the one check that cannot be faked. A second block saying the same thing in fewer words is the failure this spec exists to remove.

### The answered turn spends one step fewer

```gherkin
Given the themes question from the requirements, asked the same way
When  the turn ends on the answer
Then  the steps list ends at the step that called answer_from_search
And   it holds no step after it
```

The observed turn spent eight steps and the eighth only restated. Count the steps rather than trusting the panel: this is the check that the ending fires on the call rather than one step later.

### A follow-up question does not re-search what was just answered

```gherkin
Given a turn that ended with an answer about three weeks of notes
When  the user asks a follow-up such as "what about the week before that?"
Then  the turn answers the follow-up
And   it does not repeat the first answer's findings as though they were new
```

This is the observable side of D4. A follow-up that searches the same three weeks again means the history lost what the turn concluded, whatever the panel shows.

### An editing turn still ends with a reply

```gherkin
Given a note is open
When  the user asks for an edit to it
Then  the note is edited
And   the panel shows an assistant reply saying what changed
```

The regression check. Ending a turn on a tool must not end turns that no tool ended before, and the assistant entry is what most turns finish with.

### A question the model answers in text still works

```gherkin
Given no note is open
When  the user asks something the model answers without searching
Then  the panel shows one assistant reply
And   it shows no answer block
```

Both routes to a spoken answer have to survive. A model that reaches for answer_from_search where it used to reply in text has changed behaviour this spec did not ask for, and is worth reporting even though it passes.

### Asking the user still continues the turn

```gherkin
Given no note is open
When  the user gives an instruction vague enough that the model calls ask_user
And   the user answers the question in the panel
Then  the turn carries out the answer rather than ending on it
```

The distinction the requirements turn on, checked rather than assumed. A turn ending here means the ending was wired to tools that park on the user rather than to the one that is terminal.
