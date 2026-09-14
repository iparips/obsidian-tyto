---
created: 2026-09-14
updated: 2026-09-14
---

# Writing The Session Outside The Panel: Spec

Closing the Tyto panel mid-dictation edits the note and writes no session record
at all. Reopening finds the previous session, or none.

The turn is fine. The audio is sent, the model runs and the note changes, all of
which survive the panel because the engine owns them. What does not survive is
the record saying it happened: the write is reached through a React effect, and
unmounting stops effects running.

One rule replaces it. Whenever the panel's history changes, the record is
rewritten, by something that is not React's. There is no turn ending to detect,
and no path where the write is owed but not made.

That also closes a window the earlier spec named and deferred. A record written
as the history changes exists before the turn ends, so a WebView evicted
mid-turn keeps what was already shown.

- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it
- [2-requirements.md](2-requirements.md) - what is lost, and why the panel cannot be the writer
- [3-design.md](3-design.md) - the rule, and why it is less machinery than writing at the turn's end
- [4-tasks.md](4-tasks.md) - build order in two commits

Made reachable by
[28-not-losing-a-recording](../../3-archived/28-not-losing-a-recording/1-index.md),
which changed a closing panel from discarding the recording to sending it. That
is the right behaviour, and it exposed the hole beneath it: before, no turn ran,
so there was nothing to record.

Closes the eviction window in
[22-session-persistence](../../3-archived/22-session-persistence/2-requirements.md),
which deferred it on the grounds that a completed turn is written and an
interrupted one is rare.
