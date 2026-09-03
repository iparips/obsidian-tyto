# Sessions Without a Note: Implementation Order

## Status

Done. Steps 1 to 6 are built, `bun run build` passes, and the exit test below
passes by hand on both surfaces.

`resetTargetNoteToOriginal` was already gone: the panel tidy-up landed first.

## Steps

Each step leaves the suite green.

1. `src/session/session-repository.ts`: the nullable note, `isBound`, and a
   nullable `targetNote`. Every caller gains a branch or a non-null assertion at
   this point, so the compiler names the full surface before any behaviour
   moves.

   `resetTargetNoteToOriginal` goes here if the panel spec has not already
   removed it.

2. `src/engine/target-note-resolver.ts`: yield no note when unbound, rather than
   failing to locate one.

   TurnRepository (Engine) holds a nullable ResolvedNote, which is what carries
   the null through the turn.

3. `src/engine/tool-dispatcher.ts`: refuse an edit when unbound, in the shape
   the unwritable-note refusal already uses. Search, load_skill and run_command
   are untouched, which is the point of the step.

4. `src/engine/prompt-builder.ts`: say no note is open when unbound.

   A prompt change is a behaviour change: the repo's convention is to verify a
   bound session's prompt is byte-for-byte unchanged, against git rather than by
   eye.

5. `src/session/views/SessionPanel.tsx` and `session-view.tsx`: say no note is
   bound, and key the panel on the session counter rather than the note name.

6. `src/main.ts`: drop the guard, build a session with a null file, and rename
   the command.

   The rename is user-visible: a hotkey bound to the old command id keeps
   working only if the id is unchanged, so the id stays and the name changes.

## Exit test

By hand in a real vault, on both surfaces.

1. Close every note, start a session, and ask a question about the vault.
   Confirm the answer arrives and the header says no note is bound.
2. In that session, ask for an edit. Confirm the reply says no note is open,
   rather than a failure with no explanation.
3. Open a note. Confirm the header names it, and an edit now lands.
4. In an unbound session, ask for something that runs an allowed command that
   opens a note. Confirm the session binds to it and the edit lands.
5. With a note open, start a session as before. Confirm nothing about it differs
   from today, including the rebind prompt when the active note changes.
6. On mobile, start a session from the drawer with no note open, and ask a
   question.

## What to decide while building

Nothing outstanding. Whether the edit tools stay offered in an unbound session
is settled in [3-component-design.md](3-component-design.md): they do, so the
model can explain the refusal rather than finding the tool absent.
