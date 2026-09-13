---
created: 2026-09-12
updated: 2026-09-12
---

# Tasks

Five commits. The suite stays green at each, and the reported session is fixed
by the third.

## Commit 1: a session-scoped record of skills read

SkillsReadRepository (Skills, new), beside the skill repository that reads the
bodies.

- A private set of names, with `record` and `has`
- A comment naming the scope and the fact it rests on: the body stays in the
  chat history

Its own test file covers recording and querying an absent name. Nothing else
changes.

## Commit 2: the record reaches the turn

TurnRepository (Engine Turn) takes the repository as a constructor parameter,
beside the paths repository it already takes, and TurnRunnerFactory (Engine
Turn) builds one per session and passes it in.

- `recordSkillLoaded` writes to the session record
- `hasLoaded` reads it, so a body already in the conversation is not sent twice

The old per-turn gate still runs, so behaviour is unchanged and the existing
tests stay green. Tests cover a skill read in one turn being known in the next.

## Commit 3: the declared argument

The guarded schemas gain a required `applicable_skills` array, added only when
the vault defines skills. ApplicableSkills (Engine Tools, new) reads the names
off one call, SkillsInSessionChecker (Engine Tools, new) answers which the vault
and the session are missing, and SkillDeclarationPolicy (Engine Tools, new)
judges the two into a SkillDeclarationVerdict (Engine Tools, new) whose state
writes its own refusal.

- ToolCatalogue (Engine Tools) chooses the schema on the `skillsExist` flag it
  already takes
- ToolDispatcher (Engine) reads the declaration where it read `mustSettleSkills`
- The unread refusal names which skills to load

Tests cover the six requirement scenarios, plus a missing argument and the
catalogue omitting it for a vault with no skills. The reported session is fixed
here: turn 2 declares a skill the session already holds and edits on its first
call.

## Commit 4: no_skill_applies retires

The tool and everything that served it come out: the constant and predicate
(ToolCall), the schema and its `isOffered` branch (ToolCatalogue),
`recordNoSkillApplies` with ALREADY_LOADED_RESULT (ToolDispatcher), and
`skillsSettled`, `settleSkills` and `loadedASkill` (TurnRepository).

SkillSection (Model Prompt) loses the sentences naming the tool and gains the
three stating the argument.

Tests asserting the retired tool are deleted rather than rewritten. The release
3 fixture must stay green: a vault defining no skills omits the section, so no
prompt text moves for it.

## Commit 5: a refusal reply names the way out

ModelsRole (Model Prompt) gains a clause on the say-what-stopped-you line: say
what the user can do next.

- The release 3 fixture is re-recorded, since the prompt text moves
- A test pins that the open note is editable on the utterance after a refused
  open, which is existing behaviour the turn scope of `refusedOpenPath` gives

Independent of the four before it, and can land first if the skill work waits.

## After the commits

Test against a real vault and a real API key, since the prompt changed and the
suite cannot catch a regression in judgement.

- Two utterances in one session: the first is refused once and recovers, the
  second edits on its first call.
- An utterance the shopping-list skill covers, in a session that has already
  read the journal skill: confirm it is refused until shopping-list is read.
- A turn refused an unchosen open: confirm the reply tells the user the open
  note is still writable, and that repeating the request writes to it.
