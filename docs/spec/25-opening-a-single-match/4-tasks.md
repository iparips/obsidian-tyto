---
created: 2026-09-12
updated: 2026-09-12
---

# Tasks

Two commits. The first changes the behaviour; the second says so in the
settings.

## Commit 1: auto mode asks about several and opens one

`NoteChoiceService.automatic` (Engine Waiting) is replaced by a collaborator
that resolves a single candidate and otherwise asks, and TurnAskersService
(Session) builds it with the same panel asker the confirm branch uses.

- The short circuit is on the request, so the asking half is shared
- `choiceOffered` (EngineFactory) becomes constant true, since auto mode now
  needs choose_note
- The parameter stays, carrying the search gate alone

Tests cover a single candidate resolving without asking, three candidates
asking, the resolved candidate being recorded for open_note, a decline in auto
mode, confirm mode still asking about one, and choose_note being offered in auto
mode with search enabled. The behaviour this spec is for lands here.

The three default callers of `automatic` move with it: EngineFactory (Engine),
TurnRunnerFactory (Engine Turn) and the test support builders. Each supplies a
default for a caller that offers no panel, so each takes the variant that
resolves one candidate and declines several rather than one that would park
forever. The release 3 fixture is untouched, since the prompt does not know the
mode.

## Commit 2: the setting says what each side does

The checkbox label and its note (SettingsPanel) describe both behaviours rather
than only the on state.

- On: Tyto shows what it found and waits for a pick
- Off: Tyto opens a note when only one matched, and asks when several did

The stored value and its two states are unchanged, so no vault migrates.

## After the commits

Test against a real vault in auto mode.

- Ask for a note only one file matches: confirm it opens with no prompt, and the
  steps list names the path.
- Ask for a note several files match: confirm the picker appears, which it never
  did in auto mode before.
- Decline that picker: confirm nothing opens and the model asks what was meant.
