---
created: 2026-09-14
updated: 2026-09-14
---

# Requirements

A session is bound to the note that is open, always. New or restored, the
binding is read from the workspace rather than carried from anywhere else.

## Motivation

A session was resumed hours after its first turn. The user opened their shopping
list, spoke "clear my shopping list", and the turn edited the previous day's
daily note instead. The edit then failed, because that note was not open in any
editor.

Two things went wrong, and they compound. The session came back bound to a note
the user had left, and the model re-ran the command that had bound it, so even
a correct binding would have been undone mid-turn.

The transcript was removed: held personal vault content.

## The rule

One rule, replacing three paths that disagree:

> When a session is bound, the target is the open markdown note, or null when
> nothing markdown is open.

It holds at every moment a binding is decided: a session starting, a session
restoring, and a note being opened while one runs.

## What the code does today

Three entry points decide a binding, and only one of them follows the rule:

| Path                                     | Today                                    | Under the rule |
| ---------------------------------------- | ---------------------------------------- | -------------- |
| A note opened while a session runs       | Rebinds silently to it                   | Unchanged      |
| A session started while another is bound | Prompts, and rebinding drops the history | Binds silently |
| A session restored                       | Keeps the stored path, never looks       | Binds silently |

The first is already the rule. EditEngine.followActiveNote states it directly:
a note the user opened themselves is as much a retarget as one a command opened,
so the session follows rather than editing the note behind them.

So the rule is not new. It is what a running session already does, applied to
the two entry points that were written before it existed.

### Where the restore skips the check

In main.ts, openSession returns the moment a stored session binds:

```typescript
if (!view.hasSession()) {
  const stored = await this.storedPanelProps(view)
  if (stored) return view.bindSession(stored)
}
this.bindOrAskRebind(view, file)
```

The early return is the defect. The active file is read at the top of
openSession and then discarded, and SessionBuilder.restore takes
stored.targetPath and nothing else. Nothing in the restore path ever asks what
is open.

### Where the listener is not yet listening

Retargeting is wired through followActiveNoteWith, called while an engine is
built, and an engine is built per session. Between the panel going away and the
panel restoring, no listener exists.

Order of events in the reported session:

1. Turn 1 runs, the engine registers the listener, the session is written.
2. The panel goes away. Obsidian or the OS unmounts the leaf.
3. The user opens the shopping list. No Tyto engine is listening.
4. The panel restores, binding to the stored path.
5. Turn 2 runs against the note the user left in step 3.

followActiveNote is a catch-up mechanism with no catch-up: it hears changes from
the moment it subscribes, and a note opened while nothing was subscribed is
invisible forever.

Reading the workspace at bind time fixes this without the listener needing a
backlog. What is open is a question with an answer at any moment, so the binding
does not have to be reconstructed from the events that led there.

## The rebind prompt goes

RebindModal asks whether to keep the current session or start over, and starting
over drops the conversation. Under the rule there is nothing to ask: the note
moved, so the binding moves.

This reverses a decision from
[desktop-mvp](../../3-archived/2026-08-28a-desktop-mvp/5-settings-ui.md), which said no
implicit rebinding. That decision predates the active-note wiring added in
[sessions-without-a-note](../../3-archived/2026-09-03d-sessions-without-a-note/1-index.md),
which made an unbound session bind to the first note the user opens. Once a
running session follows silently, a prompt on one entry point is an
inconsistency rather than a safeguard.

The prompt also conflates two things. Changing the target note and dropping the
conversation are separate, and the modal only offers them together. Under the
rule they separate cleanly: the binding follows the workspace, and Reset is
what drops a conversation.

## Losing the binding is not losing the session

The conversation, the history and the entries are the session, and none of them
are the binding. A restored session on a new note keeps everything it came back
with and edits what is in front of the user.

That is what makes the rule safe to apply silently. Nothing is discarded by
rebinding, so there is no loss to warn about.

## Why turn 2 re-ran the command

Turn 2 re-ran Open or Create File and moved the target back to the daily note.
The rule binds correctly at the start of a turn, and says nothing about a tool
call moving the target during one.

The model was not confused about whether the command had run. A tool call sits
in history as an assistant message with tool_calls followed by a tool result,
which is a completed exchange by construction. It re-ran the command because
re-running looked like the right move, and three things in the request agreed.

The prompt asks for it. CommandSection says to prefer a listed command when an
utterance names a destination. "Clear my shopping list" names one, so reaching
for a command was correct. The rule says nothing about a session already bound
somewhere, so it reads the same on turn 1 and turn 20.

The history demonstrates it. Turn 1 was five tool calls and one sentence of
reply, replayed whole from the record: name a destination, run the command, load
the journal skill, edit. The dominant pattern in context is that sequence.

NoteContextMessage confirmed the destination. It is the last message, it named
the daily note, and it states that it supersedes anything earlier. It was
correct about the session's target and doing exactly its job. To the model it
also read as the strongest-positioned answer to which note this session works
on.

Nothing contradicted any of that. The shopping list existed only in the user's
sentence, while the daily note had the binding, the worked example, and the
final word.

### What follows from that

Marking a command as already executed is not the fix. The message format
encodes that already, and restating it addresses a confusion the model did not
have.

Two changes are worth considering, and the first may be sufficient on its own:

- Binding to the open note removes NoteContextMessage's reinforcement. It would
  have named the shopping list, which is the pressure closest to the decision.
  This is the cheapest test of whether the rest matters.
- CommandSection could say what a binding command is for. Today it says to
  prefer a command that opens a named destination. It could say that a session
  already bound to that destination needs no command, so a command changes the
  target rather than re-establishing it.

Withdrawing binding commands once a session is bound is the strongest option and
the wrong one: asking for a different note mid-session is the case commands
exist for.

## What is not in this spec

- The insert_text refusal. An ambiguous anchor is real behaviour, and it
  repeated because the turn repeated.
- Reset. It still exists and still drops the conversation; the rule takes only
  the note-change half of the modal's job.
- A per-turn target. The session holds one target and follows the user.

## Test Scenarios

Setup shared by every scenario:

- A stored session bound to a daily note, holding one completed turn
- The panel is not on screen when the scenario starts

### A restored session binds to the note now open

```gherkin
Given the user opens a different note while the panel is away
When  the panel restores
Then  the session targets the note now open
And   the restored conversation is still in the history
```

### A restored session with nothing open is unbound

```gherkin
Given no markdown note is open
When  the panel restores
Then  the session is unbound
And   it binds to the first note the user opens
```

### Starting a session on another note no longer prompts

```gherkin
Given a session is bound to one note
When  the user opens another note and starts a session
Then  the session targets that note without prompting
And   the conversation is kept
```

### A note opened while the panel was away is followed

```gherkin
Given no Tyto panel is on screen
When  the user opens a note and then restores the panel
Then  the next turn edits that note
```

### A later turn edits the note the utterance names

```gherkin
Given a restored session whose first turn ran a note-opening command
And   the user has since opened a different note
When  the user speaks an instruction naming that open note
Then  the edit lands on it rather than on the first turn's note
```

This one is judgement, not logic, so it is verified against a real vault rather
than in the suite. Prompt changes are behaviour changes and the unit tests
cannot catch a regression in judgement, per
[AGENTS.md](../../../../AGENTS.md).

### An edit reaches an editor

```gherkin
Given a restored session bound to a note the user has open
When  a turn edits it
Then  the edit applies rather than failing as not open
```

## Questions

- Whether the binding rule alone stops the replay. It removes the reinforcement
  closest to the decision, and the worked example in the history stays. Worth
  measuring before changing the prompt, since a prompt change cannot be unit
  tested and this one can be tried against the reported session.
- Whether CommandSection should distinguish changing the target from reaching it.
  A session already bound to the note the utterance names needs no command, and
  the section currently reads the same whether or not one is bound.
- Whether the stored targetPath is still worth writing. Under the rule it is
  never read back, so it is either dead weight in the record or a fallback for a
  restore that finds nothing open. The latter contradicts the rule.
- Whether a non-markdown file in front should leave the session unbound or keep
  the previous binding. The rule says unbound, which matches activeNote and the
  reset path, and costs the user a binding when they glance at a PDF.

## References

### Task

- [src/main.ts](../../../../src/main.ts) - openSession's early return, bindOrAskRebind, activeNote, and the file-open registration; open first
- [src/engine/edit-engine.ts](../../../../src/engine/edit-engine.ts) - followActiveNote, which already states the rule
- [src/wiring/session-builder.ts](../../../../src/wiring/session-builder.ts) - build and restore, the two starting points that must agree
- [src/session/session-repository.ts](../../../../src/session/session-repository.ts) - the one holder of the target
- src/session/views/obsidian/rebind-modal.ts - the prompt the rule removes, deleted by the build
- [src/model/prompt/note-context-message.ts](../../../../src/model/prompt/note-context-message.ts) - the last message in the request, and the one the wrong binding corrupted
- [src/model/prompt/system-prompt-sections/command-section.ts](../../../../src/model/prompt/system-prompt-sections/command-section.ts) - the rule that asks for a command when an utterance names a destination
- [src/session/models/session-snapshot.ts](../../../../src/session/models/session-snapshot.ts) - StoredMessages, which replays turn 1's tool calls whole

### Project

- [sessions-without-a-note](../../3-archived/2026-09-03d-sessions-without-a-note/1-index.md) - the active-note wiring that made following the user the norm
- [session-persistence](../../3-archived/2026-09-07c-session-persistence/1-index.md) - why a session is restored at all, and what a record holds
- [writing-the-session-outside-the-panel](../2026-09-14i-writing-the-session-outside-the-panel/2-requirements.md) - the change to when a record is written, which this reads back

### Architecture

- [model-chosen-targets](../../3-archived/2026-09-03f-model-chosen-targets/1-index.md) - how a command moves the target, which is the move being replayed
