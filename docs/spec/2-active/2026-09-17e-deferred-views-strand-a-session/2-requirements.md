---
created: 2026-09-17
updated: 2026-09-17
---

# Requirements

A session strands itself on a note that is open. The second utterance of a
conversation is refused before any model call, saying the note is not open in an
editor.

Fixing the cause exposed three more things worth changing, so the work is four
pieces: the deferred-leaf read, the refusal built on top of it, the turn-end
scroll that moves the user on mobile, and the transcript that misattributes it
all. Decisions D2 and D5 to D6 in [3-decisions.md](3-decisions.md) carry the
reasoning.

## Motivation

Obsidian 1.7.2 made every background view deferred. A leaf in the background
holds a DeferredView (Obsidian) rather than the MarkdownView (Obsidian) its type
implies, and that stand-in carries neither a file nor an editor.

Three places in this plugin read the view off a markdown leaf and assume it is a
MarkdownView. Such a read concludes the note has no editor whenever its leaf is
deferred, which is whenever the tab is not the visible one in its tab group.

Only one of the three can reach that state today. WorkspaceNoteLocator (engine)
resolves a note that has been sitting in the background, so it hits it every
time. The other two run while a note is being opened into the foreground.

The cost lands when the turn opens. A turn's target is resolved from the
session's path as the turn starts, so TargetNoteResolver (engine) fails there,
TurnRunnerFactory (engine) refuses the turn, and the utterance never reaches the
model. Every later turn resolves the same path and fails the same way, so the
session is dead rather than degraded. The user is looking at the note the panel
names and the panel says it cannot reach it. Pressing Reset is the only way out,
and it discards the conversation.

The refusal is the second thing wrong. Telling the user a note is not open in an
editor asks them to fix something they cannot see and did not break, when the
path is known and the file is right there. D5 removes it.

The third is that the plugin moves the user around. Turn end scrolls whichever
note holds an editor, and on mobile the panel holds the screen, so that scroll
lands on a note nobody is reading. D6 narrows it to the note in front.

The unit suite cannot see any of this. FakeWorkspace (test-support) mounts a
full view with an editor on every leaf, so no test can construct the state that
breaks. The suite is green and has been throughout.

The transcript is the fourth piece. A turn with no steps reprints the previous
turn's setup as its own, so the one artefact a user sends with a bug report
misattributes the failure.

## In Scope

- Load a deferred leaf before reading its view. WorkspaceNoteLocator (engine) is
  the one that fails today, since it resolves a note that has been sitting in the
  background. NoteOpener (engine) and OpenedNoteWait (commands) share the same
  unchecked cast and are fixed with it, though both run against a note being
  opened into the foreground, so neither can currently reach a deferred leaf.
- Raise minAppVersion to 1.13.0, the latest, so no version guard is needed. Both
  members arrived in 1.7.2 and the manifest says 1.5.0. The
  community-plugin-submission spec makes the same bump for the settings API, so
  whichever lands first owns the manifest edit.
- Load only the leaf holding the path being resolved. The Obsidian guidance is
  that loading discards a performance optimisation, so a sweep across every
  markdown leaf trades one bug for a slower workspace.
- Stop refusing a turn because the target will not resolve. A note whose leaf is
  deferred is loaded in place and keeps its editor; a note with no leaf resolves
  without one and is written through the vault, which TargetNoteWriter (engine
  note-editing) already does when the editor has moved on.
- Move nothing on screen. loadIfDeferred neither activates nor reveals a leaf,
  and no reopen is attempted, so a user who chose the panel stays on it.
- Focus the edit only on the note the user is looking at. focusEdit (engine
  note-editing) currently scrolls any note holding an editor, which is the jerk
  on mobile.
- Give FakeWorkspace (test-support) a deferred-leaf state, so the regression is
  reachable from a test.
- Fix the transcript's setup attribution, so a turn with no steps reports the
  lines that belong to it.

## Steps to Replicate

Reproduced against WorkspaceNoteLocator (engine) with a leaf whose view is an
empty object, which is the shape a deferred leaf presents. The failure message
matches the reported one exactly.

1. Open a note and start a session on it.
2. Say something that runs a command opening another note, so the session
   retargets. A daily-note command does this.
3. Let the opened note fall into the background. Switch to another tab in the
   same tab group, or background Obsidian on a phone.
4. Return to the note and say anything else.
5. The turn is refused with "<path> is not open in an editor". The transcript
   records no turn step for it, and its Setup block lists the previous turn's
   work.

## References

Repo-relative links: this repo sets no sdd.link_base row, so they resolve in a
checkout rather than in a hosted view.

### Task

- [3-decisions.md](3-decisions.md) - open first. Six decisions, five resolved, and the assumptions the design rests on.
- [src/engine/note-binding/workspace-note-locator.ts](../../../../src/engine/note-binding/workspace-note-locator.ts) - the failing read, and the message the user sees.
- [src/engine/note-binding/note-opener.ts](../../../../src/engine/note-binding/note-opener.ts) and [src/commands/opened-note-wait.ts](../../../../src/commands/opened-note-wait.ts) - the same assumption twice more, both deciding whether an editor exists.
- [src/engine/note-editing/target-note-writer.ts](../../../../src/engine/note-editing/target-note-writer.ts) - the vault fallback D5 relies on, already built, plus the focusEdit guard D6 tightens.
- [src/engine/note-editing/note-editor.ts](../../../../src/engine/note-editing/note-editor.ts) - focusEdit itself: setCursor and the centred scroll that jerks the view.
- [src/test-support/fake-workspace.ts](../../../../src/test-support/fake-workspace.ts) - open when writing the test. Explains why the suite never caught this.
- [src/session/transcript/transcript-turn-section.ts](../../../../src/session/transcript/transcript-turn-section.ts) - the setup slice a turn with no steps misreports.

### Project

- [Defer views](https://docs.obsidian.md/plugins/guides/defer-views) - Obsidian's own guidance, including the instanceof rule and the warning about loading sparingly.

### Architecture

- [docs/architecture/6-reaching-a-note.md](../../../architecture/6-reaching-a-note.md) - open first of these. Owns note-binding and the rule that a path becomes writable only through an editor.
- [docs/architecture/4-the-turn.md](../../../architecture/4-the-turn.md) - open when changing where a resolve happens. Owns the turn's shape and what dies with it.
