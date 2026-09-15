---
created: 2026-09-15
updated: 2026-09-15
---

# Tasks

Three commits. The first adds the reader, the second makes both entry points use
it, the third takes the prompt out.

That order keeps the suite green at each. After commit 2 the rule holds and the
reported bug is fixed; commit 3 removes what the rule made unreachable.

## Commit 1: something that answers what is open

ActiveNote (Wiring, new) returns the open markdown note's path, or null. Built
by PluginScope, which already holds the App for exactly this kind of reader.

- Null for a canvas, a PDF or a Bases file, matching what activeNote already
  does for the same reason: a session bound to one is stuck until it is reset
- Null when nothing is open, which is an unbound session
- Nothing consumes it yet, so the suite is green on the reader alone

Tests cover a markdown file, a non-markdown file, and nothing open.

## Commit 2: both entry points read the workspace

SessionBuilder takes an ActiveNote and assemble asks it. build stops taking a
file, restore stops passing the stored path, and the target stops being a
parameter either caller decides.

- SessionRepository.restored still takes the stored path, since that is how the
  repository is constructed; assemble overwrites it
- The record is unchanged, so a session written before this restores after it
- targetPath stays in the snapshot as a diagnostic, never read back
- main.ts:148, startNewSession, stops passing activeNote() to buildPanelProps
- EditEngine.followActiveNote is untouched, and still follows the user mid-session
- The listener and its one-engine guard are untouched: nothing needs a backlog
  once the binding is read at assemble time

Tests cover a restored session binding to the open note rather than the stored
one, binding to null when nothing markdown is open, binding correctly when the
open note matches the stored one, and keeping its entries and chat history
whatever it binds to. A fresh session binds to the open note, and one built with
a canvas in front is unbound.

The reported bug stops here.

## Commit 3: the prompt goes

RebindModal and bindOrAskRebind go. openSession collapses to revealing the view
and binding if nothing is bound.

- buildPanelProps loses its file parameter, and TytoPlugin.activeNote goes with
  the last caller that needed a TFile
- view.boundNoteName loses its only production reader; it stays for the tests
  that assert what a bound session names, or goes with them
- Reset is untouched, and still discards the conversation and the stored record
- No test deletions: RebindModal has none

This reverses "no implicit rebinding" from
[1-desktop-mvp](../../3-archived/1-desktop-mvp/5-settings-ui.md). Note it in the
commit message, since the architecture docs cite that spec.

## What to measure before building

Two claims the design makes, worth checking rather than trusting.

That getActiveFile is answerable when assemble runs. The restore path runs from
SessionView.onOpen, which is Obsidian reopening a leaf on startup. If the
workspace is not yet settled at that moment, the reader returns null and a
restored session comes back unbound rather than wrongly bound. That is a
degraded outcome rather than the bug, but confirm it before assuming otherwise:
onLayoutReady is the hook if it turns out to matter.

That nothing else reads notePath expecting the stored value. The panel header
shows it, and the transcript metadata names the note. Both should show what the
session is now on, which is what the rule gives them, but grep before changing
the meaning.

## After the commits

Test against a real vault and a real API key.

- Reproduce the report: run a turn, close the panel, open another note, reopen
  the panel, and speak an instruction naming that note. Confirm the edit lands
  on it.
- Same again on a phone, where the panel is unmounted by the OS rather than by
  the user, which is how the reported session lost its listener.
- Restart Obsidian with a session stored and a different note open, confirming
  the restore binds to what is open rather than coming back unbound.
- Open a session with a canvas in front: confirm it is unbound and binds to the
  first note opened.
- Start a session on another note while one is bound: confirm no prompt, and the
  conversation is kept.

Then the open question the design names: whether the model still re-runs the
binding command once the target is right. Speak the reported utterance and read
the steps. If the command is re-run, CommandSection is the next lever and a
separate change.
