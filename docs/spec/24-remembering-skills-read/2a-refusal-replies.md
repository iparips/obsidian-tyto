---
created: 2026-09-12
updated: 2026-09-12
---

# Refusal Replies

A refusal the user cannot act on. The same family as the skill gate in
[2-requirements.md](2-requirements.md): a message that reports a block without
naming the way past it.

## What happens

The user asks to open another note and write to it. The model calls open_note
without offering the note first, is refused, and its edit is refused after it,
because the note still bound is the one the user has open rather than the one
the turn reached for. Both refusals are correct.

The reply is what fails. ModelsRole (Model Prompt) says only to say what stopped
you, so the model paraphrases a message written for itself: call choose_note
with it, open it, then edit. The user reads that their request failed.

What they are not told is that the note in front of them is still writable. It
is: `refusedOpenPath` (TurnRepository) is turn-scoped, so the next utterance
starts clean and an edit to the open note applies on its first call. A user who
does not know that resets the session instead of saying it again.

## What is required

- A reply that reports a refusal also says what the user can do next
- The open note stays editable on the next utterance, as it already is

The second is stated to pin it, not to change it. No permission moves.

## Test Scenario

### The open note is editable after a refused open

```gherkin
Given the previous turn was refused an unchosen open and made no edit
When  the user asks for the same content in the note they have open
Then  the edit applies on the first call
```

## References

- [src/model/prompt/system-prompt-sections/models-role.ts](../../../src/model/prompt/system-prompt-sections/models-role.ts) - the say-what-stopped-you line
- [src/engine/turn/turn-repository.ts](../../../src/engine/turn/turn-repository.ts) - `refusedOpenPath`, turn-scoped, which is why the next utterance is clean
