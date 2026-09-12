---
created: 2026-09-12
updated: 2026-09-12
---

# Requirements

A skill read once in a session stays read. Every guarded call names the skills
that cover its utterance, and the harness refuses until those are read.

The second refusal, and the reply that leaves the user stuck, is in
[2a-refusal-replies.md](2a-refusal-replies.md).

## Steps to Replicate

In a vault defining skills, with a daily note open and search enabled:

- Say "add a heading to the current note, Lindsay, and under it write ...".
- Let the turn finish and apply its edit.
- Say "add another paragraph after it".
- Watch the steps list.

## What happened

The first turn recovered. The second did not.

- Turn 1 called insert_at, was refused for unsettled skills, loaded the journal
  skill, called no_skill_applies, was refused for that, then edited.
- Turn 2 called insert_text and was refused for unsettled skills.
- Turn 2 called insert_text again, was refused identically, and stopped stuck.

The error shown to the user named the refusal twice over: refused the same thing
2 times and stopped.

## The two faults

### A gate that forgets what the conversation remembers

TurnRepository (Engine Turn) holds `skillsSettled`, and TurnRunnerFactory
(Engine Turn) builds a fresh TurnRepository per turn. SessionRepository (Session)
holds the messages and is built once, so the journal body loaded in turn 1 is
still in the history sent for turn 2.

The model reads a skill it has in front of it, and a refusal saying it has not
checked. Retrying the edit is the only move that does not require agreeing with
a false statement, and retrying is what it did.

The precedent for the right scope is already in the codebase.
PathsReturnedByVaultRepository (Search Models) is session-scoped, and its comment
gives the reason: finding a note is knowledge and does not expire the way consent
to write to it does. A skill body reaching the model is the same kind of fact.

### A gate that never asks which skill

The gate checks that the question was answered, not that the answer fits. Any
load satisfies it, so a turn that read the journal skill may then edit the
shopping list without reading the skill that owns it.

Fixing the first fault alone makes this worse. Once a session record is open,
the gate stops asking at all, and the incidental nudge a per-turn reset gave
disappears with it.

## What the model declares

The skills covering an utterance are named on the call itself, as a required
`applicable_skills` argument on every guarded tool. An empty array says none
covers it.

The harness checks the declaration against the session record, never against its
own judgement of what fits. It refuses a name no skill carries, and refuses a
name not yet read, saying which to load. A satisfied call proceeds in the same
step, so a turn whose skills are already read spends no extra round trip.

This retires no_skill_applies. An empty array is the same claim in the same
place, and two ways to say one thing is one too many.

The declaration is a claim the harness cannot verify. A model that declares
nothing edits unimpeded, exactly as one that ignores a prompt rule does today.
What the argument adds is commitment: naming a skill obliges reading it, in the
same call that would otherwise skip it.

## What a correct session does

- Turn 1 declares journal, is refused with the name to load, loads it, declares
  again, and edits.
- Turn 2 declares journal, which the session already holds, and edits on its
  first call.
- A turn whose utterance the shopping-list skill covers declares it, and is
  refused until it is read, whatever was read earlier.
- A turn covered by nothing declares an empty array and proceeds.

## Test Scenarios

Setup shared by every scenario is a vault defining the journal and
shopping-list skills, with a bound note.

### A skill read in an earlier turn satisfies a later declaration

```gherkin
Given the journal skill was read in an earlier turn of this session
When  the model calls an edit tool declaring applicable_skills journal
Then  the edit applies
And   no refusal is published
```

### An undeclared skill is refused with the name to load

```gherkin
Given no skill has been read in this session
When  the model calls an edit tool declaring applicable_skills journal
Then  the call is refused naming journal as the skill to load
And   the note is unchanged
```

### A declaration covering a skill read for a different utterance is still held

```gherkin
Given the journal skill was read in an earlier turn of this session
When  the model calls an edit tool declaring applicable_skills shopping-list
Then  the call is refused naming shopping-list as the skill to load
```

### An empty declaration proceeds

```gherkin
Given no skill has been read in this session
When  the model calls an edit tool declaring no applicable_skills
Then  the edit applies
```

### A declared name no skill carries is refused

```gherkin
When  the model calls an edit tool declaring applicable_skills gardening
Then  the call is refused saying no skill carries that name
And   the refusal lists the skills this vault defines
```

### A vault with no skills is unchanged

```gherkin
Given the vault defines no skills
When  the model calls an edit tool with no applicable_skills argument
Then  the edit applies with no skill check
```

## Questions

- A session restored from disk brings back the messages but not the record of
  what was read, so the first declaration after a restore is refused once.
  Whether StoredSession (Session Models) carries the names is out of scope here.
- Multiple calls in one turn each carry their own declaration, and they may
  disagree. The design treats each call on its own, since each is separately
  refusable.

## References

### Task

- [src/engine/tools/tool-schemas.ts](../../../src/engine/tools/tool-schemas.ts) - open first; the schemas gaining the argument, and the tool that retires
- [src/engine/turn/turn-repository.ts](../../../src/engine/turn/turn-repository.ts) - holds `skillsSettled` and the loaded set
- [src/engine/tool-dispatcher.ts](../../../src/engine/tool-dispatcher.ts) - the gate, `loadSkill` and `recordNoSkillApplies`
- [src/model/prompt/system-prompt-sections/skill-section.ts](../../../src/model/prompt/system-prompt-sections/skill-section.ts) - the rules that change with the tool

### Project

- [docs/architecture/10-asking-the-model.md](../../architecture/10-asking-the-model.md) - where skills enter the model, and why the body never passes through message assembly
