---
created: 2026-09-12
updated: 2026-09-12
---

# Requirements

Auto mode opens a note the search identified, and asks when the search did not
identify one.

## What the two modes promise

| Mode    | One candidate | Several candidates | The promise                                |
| ------- | ------------- | ------------------ | ------------------------------------------ |
| Confirm | Asks          | Asks               | You see every open before it happens       |
| Auto    | Opens         | Asks               | You are asked only where there is a choice |

Confirm is unchanged. Auto changes on both columns: it stops taking the first of
several, and it stops being offered the choosing tool at all.

## What auto mode does today

It takes `candidates[0]`, whatever the length. A search that returned ten notes
opens the model's first guess, unseen.

[14-choosing-the-note](../14-choosing-the-note/2-requirements.md) said why that
is the weak half, in the requirement that defined it: auto mode opens the one
note the model named, a shortlist gives it several, and taking the first is a
decision rather than a translation. The mode was built before shortlists existed
and was never revisited for them.

So auto mode today is two behaviours under one name. Opening a note nothing else
could have meant is a translation. Opening the first of ten is a guess.

## What it does instead

Keep the translation, drop the guess.

- One candidate opens, with no question.
- Several ask the user which they meant, exactly as confirm mode does.
- A declined shortlist behaves as it does in confirm mode.

Auto mode gains the choosing tool, which FR13 withheld from it. Withholding it
was correct while the mode never asked anything; a mode that asks about several
candidates needs the tool that asks.

## What a single match still costs

A search can be confidently wrong. [19-relative-dates](../19-relative-dates/2-requirements.md)
records a glob on a guessed date order matching a real note, so one hit is not
one correct hit.

In auto mode that note now opens unseen, and an edit can land on it before the
user reads the path. The steps list names it, so it is visible after the fact
rather than before, and Obsidian's own undo is what reverses the edit.

That is the trade the mode is for. A user unwilling to take it has confirm mode,
which is the default and does not change.

## Test Scenarios

Setup is a vault with search enabled and a bound note.

### Auto mode opens a single match

```gherkin
Given the vault is in auto mode
And   a search returned exactly one note
When  the model offers it
Then  the note opens
And   the user is not asked
And   a step naming the opened path is published
```

### Auto mode asks about several

```gherkin
Given the vault is in auto mode
And   a search returned three notes
When  the model offers them
Then  the user is asked which they meant
And   nothing opens until they pick
```

### Auto mode is offered the choosing tool

```gherkin
Given the vault is in auto mode with search enabled
When  the tool schemas are built
Then  choose_note is offered
```

### Confirm mode asks about a single match

```gherkin
Given the vault is in confirm mode
And   a search returned exactly one note
When  the model offers it
Then  the user is asked
And   nothing opens until they pick
```

### An opened single match is consent for the turn

```gherkin
Given the vault is in auto mode
And   a single candidate opened without asking
When  the model edits that note twice
Then  both edits apply
And   the user is asked nothing
```

### A path no search returned is still refused

```gherkin
When  the model offers a path no search returned
Then  the open is refused
```

## Questions

- Whether the setting's label still describes it. "Ask which note Tyto should
  open" reads as always-ask, which is now only confirm mode. The design renames
  the copy rather than the stored value.
- Whether a user on auto mode should be told, once, that it now asks about
  several. No migration is needed and the change only removes a guess, so the
  position taken is no notice.

## References

### Task

- [src/session/turn-askers-service.ts](../../../../src/session/turn-askers-service.ts) - open first; the mode branch where the single-match rule goes
- [src/engine/waiting/note-choice-service.ts](../../../../src/engine/waiting/note-choice-service.ts) - `automatic`, which becomes the single-match collaborator
- [src/wiring/engine-factory.ts](../../../../src/wiring/engine-factory.ts) - `choiceOffered`, gated on the mode today
- [src/model/prompt/system-prompt-sections/search-section.ts](../../../../src/model/prompt/system-prompt-sections/search-section.ts) - the offer-even-a-single-candidate rule

### Project

- [14-choosing-the-note](../14-choosing-the-note/2-requirements.md) - FR13, which this narrows, and the consent model it rests on
