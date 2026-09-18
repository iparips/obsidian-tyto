---
created: 2026-09-18
updated: 2026-09-18
---

# Searching For A Misheard Name: Acceptance Criteria

Whether a model stops looping is a judgement no unit test makes, so the behaviour checks are all here. The suite proves the prompt carries the text and the guard ends the turn; only a real vault says whether the model acts on either.

## Setup

- A real vault and a real API key, per the repo's rule that a prompt change is a behaviour change
- Search enabled in settings
- A note whose title spells a name a transcriber will mishear: `# Cuddles with Cat`, tagged `#reflection/cat/cuddles`, in the current week's folder
- No note open, so the session is unbound and every turn must search

### The model answers from a note it has already read

```gherkin
Given no note is open
When  the user asks "Did I enjoy my catch up with Kat yesterday?"
And   the model resolves the date, globs the week folder and reads the Cat note
Then  it answers from that note
And   it runs no further search for the spelling "Kat"
```

Stopping after two or three searches rather than none is a partial pass: the guard caught it, the prompt rule did not. Say which, since they are fixed in different files.

### A misheard name is not re-searched under the same spelling

```gherkin
Given a turn where grepping for "Kat" returned nothing
When  the model continues the turn
Then  it does not grep for "Kat" again
And   it does not grep for a longer phrase containing it, such as "catch up with Kat"
```

### The default context is wide enough to answer from

```gherkin
Given a note mentioning Cat fourteen times
When  the model greps for "Cat" and reads the excerpts back
Then  it answers from them rather than calling read_note on the same note
```

That every match comes back and that touching windows merge are both unit-tested, so neither is checked here. What a person judges is the width: report how often the model still needed `read_note` afterwards. Often means the default of three lines is too narrow, never means it may be too wide, and either way the fix is one constant.

### A turn that runs out of context says so and offers a way to continue

```gherkin
Given a question whose searches return more than the context window holds
When  the turn runs out of context
Then  the panel says the turn ran out of context, not that the API returned an error
And   it names what the turn had found before it stopped
And   it offers a continuation prompt the user can copy into a new session
```

Provoke it with a broad pattern over a large vault rather than by contriving a note. The check that matters most is the last line: paste that prompt into a fresh session and confirm the new turn can carry on without the user re-explaining what they wanted.

Since the budget is out of scope per D4, this ending is the only thing standing between a wide search and a dead turn. A raw `API responded 400` here is a fail even if everything else passes.

### A question across several notes is answered, not turned into a note to open

```gherkin
Given no note is open
When  the user asks "What are some favorite things I've been doing with Cat over the last few months?"
Then  it answers with answer_from_search, citing the notes it drew on
And   the answer draws on several notes, not one
And   it does not offer a note to pick with choose_note
```

This is the turn the existing prompt has no route for, so it is the check most likely to fail first. A `choose_note` offer here is the specific wrong behaviour: the question has no single note to pick, and the edit route is what the prompt currently points every search down.

Whether the model reads notes in full first is its call, not a requirement of this check. With D4 the grep may already carry enough. What matters is that the answer is synthesised from several notes and cites them.

### Fruitless searching stops, by the model or by the guard

```gherkin
Given no note is open
When  the user asks about a person no note mentions under any spelling
Then  the model stops searching and says what it could not find
And   the turn ends by the model replying rather than by the guard ending it
But   where the guard ends it instead, the panel says the searches found nothing
And   it does not say the steps ran out
```

Two outcomes pass and they mean different things, so name which one you saw. The model stopping on its own says the announcement worked, per D1 and D3. The guard ending the turn says the model read the rule and searched anyway: the fallback did its job and the prompt did not, which are fixed in different files.

An Exhausted ending is the failure. It means neither fired, and it sends the user to the steps list instead of telling them the vault does not hold what they asked for.
