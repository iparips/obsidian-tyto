---
created: 2026-09-07
updated: 2026-09-11
---

# Requirements: Session Persistence

Let a user leave the app and come back to the session they left.

## Table of Contents

1. [Problem](#problem)
2. [Goals](#goals)
3. [Non-goals](#non-goals)
4. [User stories](#user-stories)
5. [What a session is](#what-a-session-is)
6. [Requirements](#requirements)
7. [Non-functional requirements](#non-functional-requirements)
8. [What the design must settle](#what-the-design-must-settle)

## Problem

Obsidian on mobile runs in a WebView the operating system may evict whenever the
app is not in front. Taking a phone call between two instructions is enough.

Owl comes back with an empty panel and a model that remembers nothing. The user
reads a blank drawer where their conversation was, and a follow-up like "add
another one like that" has no antecedent.

The desktop hides this. A session there lives as long as the plugin, so the
failure only shows on the surface the plugin was designed around.

Nothing about this is a crash. Every value the session needs is a string or a
list of them, and both stores holding them are already free of collaborators.
The session is lost because nothing writes it down.

## Goals

- Survive a backgrounded app, so a session outlives the WebView holding it.
- Restore what the user reads and what the model remembers together, since
  either alone is worse than neither.
- Settle an interrupted turn rather than resuming it, since the request it was
  waiting on is gone.
- Cost a write per turn, not a write per keystroke.
- Stay one session, so restoring is a load rather than a choice.

## Non-goals

- A history of past sessions. One session is restored; the previous one is
  replaced when a new session starts.
- A session per note. The session follows the user, which is what makes it one.
- Resuming a turn mid-flight. The model request is gone with the WebView, and
  rejoining it means reissuing it, which is a retry rather than a resume.
- Syncing a session between devices. A session is where the user is.
- Persisting a recording. Audio in flight is discarded on background already.

## User stories

- As a user on a phone, I take a call mid-session and come back to the panel I
  left, with the model still knowing what we were doing.
- As a user, an instruction I gave before backgrounding is still in the history,
  so a follow-up refers to it and a retry repeats it.
- As a user, a shortlist I never answered comes back saying the turn ended,
  rather than as rows that no longer do anything.
- As a user, Reset clears the stored session as well as the live one, so the
  thing I reset does not come back.
- As a user who copies a transcript after a restore, I read the turns that came
  back as the panel showed them, without what each step was sent, and a line
  marking where the restore was.
- As a user on the desktop, a session survives quitting and reopening Obsidian,
  which is the one way it was lost there.

## What a session is

Three stores hold it, and only two must survive.

| Store                | Holds                         | Restored            |
| -------------------- | ----------------------------- | ------------------- |
| SessionRepository    | The target path, the messages | Yes                 |
| PanelState           | The phase, the entries        | Yes, phase excepted |
| TranscriptRepository | What each turn step was sent  | No                  |

The phase is the first exception. A restored session is never mid-turn, because
the turn that set a running phase is gone, so the phase restores as idle
whatever it was when the app went away.

The transcript is the second, and it is a real loss rather than a technicality.
A user who copies a transcript after a restore gets the earlier turns as the
panel showed them, without what each step was sent. It holds every prompt and
note excerpt verbatim, which NFR2 keeps off disk.

## Requirements

### Writing the session

FR1. Write the session after every turn, so a backgrounded app loses at most the
turn that was running.

FR2. Write the target note, the chat history and the panel entries together, so
a restore cannot bring back one without the others.

FR3. Write nothing while a turn is running, since a half-turn is not a state the
session can be restored to.

### Restoring the session

FR4. Restore the session wherever a panel first appears, including the sidebar
leaf Obsidian reopens by itself, so the user never swipes to an empty panel and
has to know to invoke Owl again.

FR5. Restore the panel to the idle phase whatever phase was stored, since no
turn is running after a load.

FR6. Settle every pending entry on restore, so a shortlist or a question the
user never answered comes back as a record rather than as live controls.

FR7. Restore the target note by path, and leave the session unbound when no
editor is showing that note.

FR7a. Restore no transcript, and leave a copied transcript readable for the
turns that preceded the restore, so a session that came back is still worth
copying.

FR7b. Say the session was restored, and name the day, time and zone it was last
written, so a restore is visible at all and the user can tell how old the
conversation they are resuming is.

FR7c. Read a record that carries no written time, showing the line without one,
so a session stored by an earlier build still restores.

### Discarding the session

FR8. Discard the stored session when the user resets, so the session they
replaced does not return.

FR9. Discard a stored session the current version cannot read, rather than
failing to load, so a shape change costs a session and not the plugin.

### Staying out of the way

FR10. Never block a turn on a write. A failed write costs the session, and the
turn it was recording has already happened.

FR11. Keep the stored session out of the settings file, so a write to one
cannot lose the other.

## Non-functional requirements

NFR1. A restore reads one file and parses it once, so opening the panel is not
slower for having a session to restore.

NFR2. The stored session holds no API key and no note content beyond what the
chat history already carries.

NFR3. A session that cannot be written leaves the running session untouched, and
says nothing: the user did not ask for a write.

NFR4. Nothing on the desktop gets slower or changes mid-session. A session there
is never evicted, so the only visible difference is that one survives a restart.

## What the design must settle

Settled in [3-component-design.md](3-component-design.md):

- The entries are stored as they are, not rebuilt from the chat history.
- A cancelled turn reaches the plugin through a new callback carrying the
  ending, beside the two that carry a notice message.
- The transcript is not stored, so a restored session explains its earlier turns
  less fully than a session that never went away.

Still open:

- Whether a write per turn is enough on a phone, where the eviction can land
  between a turn ending and the write completing.
- How large a session may grow before the write is worth trimming, given a long
  session carries every tool result the model was sent.
