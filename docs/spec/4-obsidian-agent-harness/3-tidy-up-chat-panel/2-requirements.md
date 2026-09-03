# Requirements: Tidy Up Chat Panel

Make the panel read as a conversation, so what the user said, what the agent
said, and what the harness did are told apart before any of them is read.

## Problem

Every entry is a padded box separated by a gap. Only the background colour
differs, and in a dark theme those colours sit within a few points of each
other.

So the panel gives a spoken instruction, a note naming which instruction files
loaded, and the agent's reply the same visual weight. The reply is the thing the
user came back for, and it is the hardest to find.

The harness made this worse rather than caused it. A turn that runs a command
now emits an instructions line and a command line before the reply, so a
four-entry turn is four identical boxes where one entry matters.

Scale is the other half. A session is read on a phone in a narrow drawer, and
padding on every entry means fewer entries fit on screen than the conversation
needs.

## Goals

- Tell the three kinds apart at a glance, before reading any of them.
- Give the agent's reply the most weight, since it is what the turn produced.
- Cost the harness notes the least room, since they are context rather than
  content.
- Say that the plugin is working, and which wait is running.
- Keep every entry selectable and copyable, which is why the boxes exist today.

## Non-goals

- Changing what any entry says. This is presentation only.
- Adding an entry kind, or publishing anything new.
- Markdown rendering inside an entry. Text stays text.
- Grouping or collapsing a turn's entries. The list stays flat.

## User stories

- As a user scanning a finished session, I find the agent's reply without
  reading the harness notes above it.
- As a user, I see what I said as a bubble on the right, so my own words are
  distinct from everything the plugin wrote.
- As a user on a phone, I see more of a conversation on screen, because context
  lines no longer carry the padding a reply does.
- As a user, I still select and copy any entry, including one I only want part
  of.
- As a user who has just spoken, I see that the plugin is working, where the
  reply will appear, rather than only that the buttons went grey.
- As a user waiting longer than usual, I see whether the wait is transcription
  or the model, so I know what is slow.

## Three weights, not six

Six entry kinds share three treatments. The kind decides what an entry says; the
weight decides how much room it is worth.

| Weight    | Kinds                    | Treatment                                   |
| --------- | ------------------------ | ------------------------------------------- |
| Utterance | user                     | Bubble, right-aligned, partial width        |
| Reply     | assistant, answer, error | Plain text, full width, no background       |
| Context   | instructions, command    | Tight muted line, no padding, no background |

The pending indicator is not a fourth weight. It occupies the reply's position
and is replaced by one, so it is styled as context: a turn in progress has not
produced anything yet.

Error sits with the replies rather than in a weight of its own. A failure is
what the turn produced, so it belongs where the user is already looking; the
error colour is what marks it, not a box.

Answer sits there too, and keeps its sources line. It is a reply that happens to
cite where it came from.

## Requirements

FR1. Render a user utterance as a bubble, right-aligned and narrower than the
panel, so the side alone says who spoke.

FR2. Render an agent reply as plain text at full width, with no background and
no bubble.

FR3. Render an error as a reply, in the error colour, rather than as a box.

FR4. Render an answer as a reply, keeping the sources beneath it.

FR5. Render instructions and command notes as tight lines, muted and smaller,
with no padding or background.

FR6. Stack consecutive context lines with no gap between them, so a turn's notes
read as one block rather than separate entries.

FR7. Keep every entry selectable, and keep the copy control reachable on each.

FR8. Keep the copy control from covering an entry's text, including in a narrow
drawer.

FR9. Show that the plugin is working while a turn runs, at the point in the
conversation the reply will appear.

FR10. Name which wait is running, so a slow transcription and a slow model are
told apart.

FR11. Replace the indicator with the reply when the turn ends, and remove it
when a turn fails or is cancelled.

FR12. Remove the return-to-starting-note button from the header.

FR13. Keep the header's target-note name and the reset control.

## Removing the return button retires FR20

FR20 of the harness MVP asks that the user can return the session to the note it
started on, and this button is its only control. Removing it retires that
requirement rather than moving it.

Nothing is lost with it. The session already follows the note the user opens:
EditEngine (Engine) is subscribed to Obsidian's file-open event, so opening any
note rebinds the session to it. Obsidian's own navigation is therefore the
return control, and the button was a second path to a state the tab bar, the
back gesture and the file explorer all already reach.

Removing it is worth doing rather than merely harmless. The header holds the
note name and the reset control on a phone too, and a button whose whole job is
duplicated by the app around it is the one to drop.

## Non-functional requirements

NFR1. Theme-driven throughout. Every colour comes from an Obsidian variable, so
a vault on a light theme or a custom one is styled by it rather than against it.

NFR2. No layout that depends on panel width. The drawer is resized freely and
the panel is read on a phone, so the bubble is a proportion rather than a fixed
size.

NFR3. Presentation changes only. PanelState, PanelReducer and every publisher
are untouched, so what reaches the panel is what reached it before.
