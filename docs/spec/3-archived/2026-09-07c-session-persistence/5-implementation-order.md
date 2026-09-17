---
created: 2026-09-07
updated: 2026-09-11
---

# Session Persistence: Implementation Order

## Status

Both commits built, suite green at 1039 tests. The backgrounding exit test below
is outstanding: it needs a phone, since only an eviction interrupts a session
mid-flight. The restart case is testable on the desktop and is in the round-trip
test.

Two files came out over the 120-line limit, both within 10 lines of it before
this change: session-builder.ts at 140 and main.ts at 134. The seam in the
builder is enginePanelProps and its EnginePanelProps type, which are a static
builder with no state. Extracting them needs a home, and both the session root
and views/ are at or over their file counts, so the split is its own change.

## Two commits

The work splits where the risk does. The first writes and reads a record with
nothing depending on it; the second makes the plugin use it.

| Commit | Steps | Delivers                             | Exit test          |
| ------ | ----- | ------------------------------------ | ------------------ |
| First  | 1-3   | The record and the store, unused     | Round trip by hand |
| Second | 4-9   | Writing on a turn, restoring on load | Backgrounding      |

The first commit ships nothing a user sees, which is the point: a record that
loses a field is cheaper to find when nothing depends on it yet.

## Steps, first commit

Each step leaves the suite green.

1. `src/session/models/stored-session.ts`: the record, and the two mappings
   ChatMessage needs.

   Read back through the factories, picking one off the role: a tool role
   through toolCallResult, an assistant role with tool calls through
   modelToolCalls. The constructor is private and must stay so.

   Entry needs no mapping and must not gain one. It is already plain data, and
   a mapping would be a second definition to keep in step with the first.

2. `src/session/session-store.ts`: read, write and discard, over the vault
   adapter.

   Takes the plugin folder as a constructor argument, as SkillRepository takes
   the skills path. An absent folder is the same as an absent session, so the
   store reads and writes nothing rather than guessing a path.

   Every failure path returns nothing rather than throwing. A session that
   cannot be read is a session that was not there, and the plugin must load
   either way.

3. The version check, and the delete that follows it.

   Test it with a record whose version is a different number, not with a
   malformed one: those are two branches and the malformed case is step 2's.

## Steps, second commit

4. `src/session/session-builder.ts`: restore beside build.

   The two share everything after the starting point. Extract what they share
   rather than letting restore reimplement the wiring. The shared part builds
   the provider, the channels, both repositories and the engine; only the target
   and the two restored stores differ.

   Seed the transcript with the restored history length here, where both are in
   hand. A step recorded against a restored history and an unseeded transcript
   claims every message the previous session wrote.

   Lift noteNameOf out of useTargetNote so restore can name the note from the
   stored path. Two callers want the same derivation.

5. `src/session/views/SessionPanel.tsx`: the entries prop, defaulting to empty.

   The reducer's initial state stops being INITIAL_PANEL_STATE and becomes a
   value built from the prop. Run it through AskedEntries.turnEnded on the way
   in, then set idle: turnEnded settles the entries and carries the phase
   through unchanged, because every caller in the reducer sets the phase itself.

6. `src/session/views/SessionPanel.tsx`: onTurnEnded, carrying a TurnEndingKind.

   Called on all three endings, beside the two notice callbacks rather than
   replacing them: those carry a summary and a message that a notice needs and
   an ending does not. The cancelled branch calls no callback today and is the
   reason this exists.

   Rename that pair to notifySucceeded and notifyFailed while adding the third.
   onTurnFinished beside onTurnEnded reads as two names for one moment, and they
   are not: one fires on success, the other on every ending.

7. `src/main.ts`: read where a panel appears, write when a turn ends, delete on
   reset.

   Two moments have a panel to restore into, and the earlier one is
   SessionView.onOpen: Obsidian reopens the sidebar leaf by itself on restart,
   so the view asks the plugin for a stored session as it mounts. openSession
   covers a leaf that existed before the plugin could restore into it. Reading
   only on openSession leaves the reopened sidebar empty until the user invokes
   Owl again, which is the failure FR4 names.

   The reset path is startNewSession on PanelPresence, which already rebuilds
   the props.

8. Verify a restored session is never mid-turn.

   The phase is stored and ignored, which reads as a bug until the comment says
   why. State it where the phase is dropped, not in the spec alone.

9. The restored entry kind, appended last by restore.

   An eleventh Entry kind, which the two exhaustive switches over that union
   will not compile without: HistoryEntry's class map and TranscriptEntryLines.
   Drop it again in StoredSessionSource, or a second restore stacks two lines.

   The line carries the time the record was written, from an optional writtenAt
   on it. Optional because a record from an earlier build has none, so the two
   absent branches are worth their own tests: no field, and a field holding
   something other than a number.

   The formatting is LocalTimestamp, which TranscriptMetadata shares rather than
   keeping the near-identical private copy it had. That gives the transcript's
   Copied row a zone it did not carry, so the sample output in
   [copy-transcript](../2026-09-10-copy-transcript/4-sample-output.md) moves with it.

## Exit test, round trip

By hand, on the desktop.

1. Run a turn, then read `session.json` in the plugin folder. Confirm it holds
   the target, the messages and the entries.
2. Edit the version field to 2. Reopen Obsidian and confirm the session is gone
   and the file is deleted.
3. Corrupt the JSON. Reopen and confirm the panel opens empty rather than
   failing to load.
4. Run a turn, quit Obsidian, and reopen it. Confirm the sidebar comes back
   holding the session, without invoking Owl. A restart reaches the same
   restore path an eviction does, so this is the one part of it the desktop
   can show.
5. Confirm the restored line names the day, time and zone of the last turn,
   not of the restore.
6. Delete writtenAt from `session.json` and reopen. Confirm the line reads
   without a time rather than showing an invalid one.

## Exit test, backgrounding

By hand in a real vault, on a phone.

1. Run two turns, then background the app for long enough that Obsidian
   reloads on return.
2. Confirm the panel shows both turns, the header names the same note, and a
   line below them says the session was restored and when it was last written.
   That line is what tells a restore from a session that never went away.
3. Ask a follow-up referring to the earlier turn. Confirm the model has the
   context.
4. Say "retry" after a turn that failed before backgrounding. Confirm it
   retries that instruction.
5. Background the app with a shortlist on screen. Confirm it returns settled,
   saying the turn ended, with no live rows.
6. Press Reset, then background and return. Confirm the reset session does not
   come back.
7. With the transcript setting on, copy a transcript after a restore. Confirm
   the earlier turns read as the panel showed them, and that the steps recorded
   since the restore cite the right messages.
8. Restore twice over. Confirm the second restore adds one line and not two,
   since the line is dropped from the record on the way out.
9. On the desktop, confirm nothing changed.

## What to decide while building

- Whether a write per turn is enough, or whether the write should also happen
  when the app reports itself hidden. The onHidden channel PanelPresence already
  carries is where that write would go.
- Whether a session that has grown past a few hundred messages is worth
  trimming, and what a trim would drop first.

Settled while building: a restored session says so and names when it was last
written, as a panel entry rather than a notice. A restored panel is otherwise
indistinguishable from one that never went away. It says nothing about the
thinner transcript those turns carry, since that shows only for a user who
copies one and the setting is off by default. See
[3-component-design.md](3-component-design.md).
