# Cancelling a Turn: Implementation Order

## Status

Built, exit test pending. Depends on nothing else in this release, and
[9-model-chosen-targets](../9-model-chosen-targets/1-index.md) depends on it:
its FR29 settles a parked question when the turn is cancelled.

Verify before starting: `bun run build` passes.

## Steps

Each step leaves the suite green.

1. `src/shared/models/outcome.ts`: the third case beside Success and Failure,
   and `Outcomes.cancelled`.

   This step breaks the build until step 1b is done, and that is the point:
   `hasFailed` narrows through `this is Failure<T>`, so a third case stops it
   narrowing to `Success<T>`. Every `.value` read behind a `hasFailed` guard
   stops compiling, at fifteen call sites across eight files.

   1b. Narrow through the success side instead. A guard the compiler can use
   for three cases is what makes the third case additive rather than a rewrite
   of every caller. Do not add `.value` to the cancelled case to dodge this.

2. `src/engine/turn-cancellation.ts`: the value, its AbortController, and
   `whenCancelled`.

   Built by `TurnFactory` and held on `Turn`, so it is reachable from the loop
   and the dispatcher without a new parameter on either.

3. `src/providers/types.ts` and `src/providers/mistral-provider.ts`: the optional
   signal on the contract, and the abort branch in the catch.

   Optional keeps every existing call site compiling. The suite mocks the
   provider with `vi.fn()` typed off `ChatProvider['complete']`, so its
   signature follows the contract automatically and no fake needs editing.

   The catch distinguishes an abort from a failure, which is the whole of NFR1
   for the provider.

4. `src/engine/turn-repository.ts`: the written-note list beside `recordEdit`.

   Nothing reads it yet. It exists so step 6 can name what a cancelled turn
   left.

5. `src/engine/edit-engine.ts`: check `isCancelled` before each model call and
   each tool call, and thread the signal into `complete`.

   This is where the loop stops. The utterance queue must release on the
   cancelled path too, or a later utterance blocks behind it.

6. `src/session/models/panel-state.ts`: the cancelling phase, the cancelled
   action and the cancelled entry.

7. `src/session/views/SessionPanel.tsx`: Cancel in the Send button's place, and
   the recording Cancel removed.

   The mic button stays as it is. Only the rightmost button changes.

8. `src/main.ts`: wire the panel's cancel to the engine.

   The engine owns the current turn's cancellation, so the plugin passes a
   function rather than the object.

## Exit test

By hand in a real vault, on both surfaces.

1. Start a long turn and cancel it while it is thinking. Confirm the panel
   returns to idle and says it was cancelled.
2. Cancel a turn that had already edited the note. Confirm the panel names the
   note, and the edit is still there.
3. Cancel a turn before it wrote anything. Confirm the panel says nothing
   changed, and the note is untouched.
4. Send a second utterance after cancelling. Confirm it runs normally.
5. Cancel while recording. Confirm the audio is discarded and no turn starts,
   as it does today.
6. Let a turn finish without cancelling. Confirm nothing about it differs from
   today.
7. On mobile, cancel a turn from the drawer and confirm the input returns.

## What to decide while building

- Whether the cancelled entry names every note written or only the last. The
  design says every, and a turn that wrote to three is the case to check by eye.
- Whether a cancel arriving during a command Obsidian is running should be
  applied once control returns, or refused with a message. The design leaves it
  applied on return, which is untested against a slow command.
