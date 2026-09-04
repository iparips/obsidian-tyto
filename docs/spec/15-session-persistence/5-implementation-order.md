# Session Persistence: Implementation Order

## Status

Not started. Depends on nothing: both stores it reads already hold plain values.

Verify before starting: `bun run build` passes.

## Two commits

The work splits where the risk does. The first writes and reads a record with
nothing depending on it; the second makes the plugin use it.

| Commit | Steps | Delivers                             | Exit test          |
| ------ | ----- | ------------------------------------ | ------------------ |
| First  | 1-3   | The record and the store, unused     | Round trip by hand |
| Second | 4-7   | Writing on a turn, restoring on load | Backgrounding      |

The first commit ships nothing a user sees, which is the point: a record that
loses a field is cheaper to find when nothing depends on it yet.

## Steps, first commit

Each step leaves the suite green.

1. `src/session/models/stored-session.ts`: the record, and the two mappings
   ChatMessage needs.

   Entry needs no mapping and must not gain one. It is already plain data, and
   a mapping would be a second definition to keep in step with the first.

2. `src/session/session-store.ts`: read, write and discard, over the vault
   adapter.

   Every failure path returns nothing rather than throwing. A session that
   cannot be read is a session that was not there, and the plugin must load
   either way.

3. The version check, and the delete that follows it.

   Test it with a record whose version is a different number, not with a
   malformed one: those are two branches and the malformed case is step 2's.

## Steps, second commit

4. `src/session/session-builder.ts`: restore beside build.

   The two share everything after the starting point. Extract what they share
   rather than letting restore reimplement the wiring.

5. `src/session/views/SessionPanel.tsx`: the entries prop, defaulting to empty.

   The reducer's initial state becomes a parameter. Run it through
   AskedEntries.turnEnded on the way in, so a restored pending entry settles
   without restating what settling means.

6. `src/main.ts`: read on load, write when a turn ends, delete on reset.

   onTurnFinished and onTurnFailed exist and the panel already calls them. A
   cancelled turn calls neither: it tells nobody by design, since the user
   stopped it and already knows. So a cancel needs a third callback, or those
   two need to become one that says how the turn ended.

7. Verify a restored session is never mid-turn.

   The phase is stored and ignored, which reads as a bug until the comment says
   why. State it where the phase is dropped, not in the spec alone.

## Exit test, round trip

By hand, on the desktop.

1. Run a turn, then read `session.json` in the plugin folder. Confirm it holds
   the target, the messages and the entries.
2. Edit the version field to 2. Reopen Obsidian and confirm the session is gone
   and the file is deleted.
3. Corrupt the JSON. Reopen and confirm the panel opens empty rather than
   failing to load.

## Exit test, backgrounding

By hand in a real vault, on a phone.

1. Run two turns, then background the app for long enough that Obsidian
   reloads on return.
2. Confirm the panel shows both turns, and the header names the same note.
3. Ask a follow-up referring to the earlier turn. Confirm the model has the
   context.
4. Say "retry" after a turn that failed before backgrounding. Confirm it
   retries that instruction.
5. Background the app with a shortlist on screen. Confirm it returns settled,
   saying the turn ended, with no live rows.
6. Press Reset, then background and return. Confirm the reset session does not
   come back.
7. On the desktop, confirm nothing changed.

## What to decide while building

- Whether a write per turn is enough, or whether the write should also happen
  when the app reports itself hidden.
- Whether a session that has grown past a few hundred messages is worth
  trimming, and what a trim would drop first.
- Whether a restored session should say it was restored, or come back silently.
