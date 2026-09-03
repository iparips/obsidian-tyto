# Model-Chosen Targets: Implementation Order

## Status

Built, exit tests pending. Depends on
[5-cancelling-a-turn](../5-cancelling-a-turn/1-index.md), which landed first:
the second commit consumes TurnCancellation (Engine) to settle a parked
question, and FR29 has no other mechanism.

Depends on [4-sessions-without-a-note](../4-sessions-without-a-note/1-index.md)
only where both touch TurnRepository (Engine), and the two changes are additive
rather than conflicting.

Verify before starting: `bun run build` passes.

## Two commits

The work splits where the features do, and each half stands on its own.

| Commit | Steps | Delivers                                       | Exit test       |
| ------ | ----- | ---------------------------------------------- | --------------- |
| First  | 1-11  | Opening a note the model found, and confirming | Opening a note  |
| Second | 12-19 | Asking the user, and the notices               | Asking the user |

The first commit ships a working feature: the model opens a note it found, the
user confirms it, and the panel says which note the turn moved to. Nothing in it
waits on a question the model wrote.

The second commit adds the question, and step 12 moves the confirmation onto the
shared parking mechanism before the second asker exists.

## Steps, first commit

Each step leaves the suite green.

1. `src/search/models/seen-paths.ts`: the turn-scoped record of what search
   offered. Held on TurnRepository (Engine), recorded by HarnessTools (Engine)
   when a search returns.

   Nothing reads it yet, so this step is the guard's data with no behaviour
   attached to it.

2. `src/engine/models/turn-budget.ts`: an open counter beside the command and
   search ones, with its own cap message.

3. `src/engine/harness-tools.ts` and `src/engine/models/tool-schemas.ts`:
   open_note, its three refusals, and its place in the offered set.

   Offered only when search is enabled, since NFR4 makes a search hit the only
   source of an openable path. That is one line in ToolCatalogue (Engine) beside
   the existing search-tools rule.

   The tool retargets nothing yet. It resolves a path and returns it, which
   makes every refusal testable before any session state moves.

4. `src/engine/open-approval.ts`: the question, the per-path hold, and the
   granted constructor.

   Built by TurnFactory (Engine) beside TurnRepository (Engine), so the hold
   dies with the turn and nothing has to expire it.

5. `src/engine/tool-dispatcher.ts`: ask before moving the target, and move it
   through the retarget path a command already uses.

   The declined branch is the one to get right: no call to SessionRepository
   (Session), no editor touched, and a result the model reads rather than an
   exception (NFR1).

6. `src/settings/settings.ts` and the settings panel: the mode, defaulting to
   confirm.

   The default matters more than the control. A user who has not thought about
   this gets the mode that cannot surprise them.

7. `src/session/models/panel-state.ts`: the confirm entry, the confirming phase,
   and the two actions.

   EntryWeights (Session) gains one row. The confirm entry weighs as a reply,
   so the table stays the three weights the panel spec settled.

8. `src/session/views/SessionPanel.tsx`: render the question, wire the answer
   back, and disable the input row while confirming.

   Cancelling a turn while confirming must answer declined. A promise left
   unsettled parks the loop and the session never returns to idle.

9. `src/main.ts`: build OpenApproval (Engine) from the setting, wired to the
   panel in confirm mode and granted in auto.

10. `src/engine/rule-builder.ts`: the command-first line, replacing the one that
    tells the model not to search for a destination.

    A prompt change is a behaviour change: verify the rest of the prompt is
    byte-for-byte unchanged, against git rather than by eye.

11. `src/session/views/SessionPanel.tsx`: the note path under the header name.

    The last of the open-note steps, and the only one that changes nothing about
    what a turn can do.

## Steps, second commit

Step 12 is a refactor rather than a feature, so it starts the commit that needs
it rather than closing the one before.

12. `src/engine/models/answer-request.ts` and `src/engine/pending-answer.ts`: the
    value, and the parking that races an answer against a cancellation.

    OpenApproval (Engine) moves onto PendingAnswer (Engine) here, so the two
    askers share one mechanism before the second one exists. Its tests from step
    4 must pass unchanged, which is what proves the move was behaviour-preserving.

13. `src/engine/user-question.ts` and `src/engine/models/turn-budget.ts`: the
    second asker, and a question counter beside the other three.

14. `src/engine/harness-tools.ts` and `src/engine/models/tool-schemas.ts`:
    ask_user, its schema, and its arguments.

    The parking stays in ToolDispatcher (Engine), where the open confirmation
    parks. HarnessTools runs a tool; it does not wait on a person.

15. `src/session/models/panel-state.ts`: the question entry, the asking phase,
    and keeping an unanswered question's text when the turn ends.

16. `src/session/views/SessionPanel.tsx`: render the question and its
    suggestions, and answer from the input row.

    The input row stays live while asking, unlike while thinking. That is the
    one place this differs from every other running phase.

17. `src/session/turn-notices.ts`: the three notices, and the visibility check
    that shows none when the panel is open.

18. `src/main.ts`: build UserQuestion (Engine) wired to the panel, and
    TurnNotices (Session) wired to the workspace.

    The notice needs to know whether the session leaf is visible, which only the
    plugin can answer.

19. `src/engine/rule-builder.ts`: the line telling the model to ask only where no
    command and no search resolves the destination.

    A prompt change is a behaviour change: verify the rest byte-for-byte against
    git, as in step 10.

## Exit test, opening a note

By hand in a real vault, on both surfaces.

1. In confirm mode, say "add toilet paper to this week's todo list" with no
   command matching it. Confirm the panel names the note with its full path and
   waits.
2. Approve. Confirm the note opens, the edit lands, and the header names it.
3. Repeat and decline. Confirm no edit lands, the header still names the note
   the session started on, and the reply says what stopped.
4. Say "open my todo and add visit doctor at the top". Confirm one question is
   asked, before the open, and the edit follows without a second question.
5. Switch to auto mode and repeat step 1. Confirm no question, and a panel entry
   saying the note was opened.
6. In auto mode, confirm the model still prefers a matching command: say
   something a daily-note command opens and check the panel shows a command
   entry rather than a search.
7. Disable search. Confirm open_note is gone rather than refusing, and the model
   says it cannot reach the destination.
8. On mobile, run step 1 in the drawer. Confirm the question is answerable
   without a dialog, and the header path truncates rather than wrapping.

## Exit test, asking the user

By hand in a real vault, on both surfaces.

1. With two notes that match equally, ask for an edit naming them ambiguously.
   Confirm the model asks which, rather than guessing or giving up.
2. Answer in your own words. Confirm the edit lands on the note you named,
   within the same turn.
3. Repeat and answer with a suggestion button. Confirm it fills the input rather
   than sending on its own.
4. Cancel a turn while it waits on a question. Confirm the panel returns to idle
   and the question's text stays on screen.
5. With the panel closed on mobile, ask something ambiguous. Confirm a notice
   appears, stays, and opens the panel when tapped.
6. Let a turn finish with the panel closed. Confirm the notice fades on its own.
7. Fail a turn with the panel closed, by using a bad API key. Confirm the notice
   reads as a failure.
8. With the panel open, run all of the above. Confirm no notice appears.

## What to decide while building

- Whether a declined open ends the turn or lets the model try again. The design
  returns a tool result, which lets it retry within the iteration cap. Watch
  whether a second question after a decline reads as nagging; if it does, the
  fix is to decline every subsequent open for the turn rather than to throw.
- The open cap's number. It sits beside three commands and four searches, and
  one is probably right given the non-goal of writing to more than one note per
  turn.
