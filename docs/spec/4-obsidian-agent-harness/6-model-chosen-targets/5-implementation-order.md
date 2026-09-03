# Model-Chosen Targets: Implementation Order

## Status

Not started. Depends on
[4-sessions-without-a-note](../4-sessions-without-a-note/1-index.md) only where
both touch TurnRepository (Engine), and the two changes are additive rather than
conflicting.

Verify before starting: `bun run build` passes.

## Steps

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

    Last because it is the only step no other step depends on, and the only one
    that changes nothing about what a turn can do.

## Exit test

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

## What to decide while building

- Whether a declined open ends the turn or lets the model try again. The design
  returns a tool result, which lets it retry within the iteration cap. Watch
  whether a second question after a decline reads as nagging; if it does, the
  fix is to decline every subsequent open for the turn rather than to throw.
- The open cap's number. It sits beside three commands and four searches, and
  one is probably right given the non-goal of writing to more than one note per
  turn.
