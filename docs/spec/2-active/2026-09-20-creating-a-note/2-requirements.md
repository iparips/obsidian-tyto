---
created: 2026-09-20
updated: 2026-09-20
---

# Requirements

The plugin cannot create a note. Every write lands in a note that already exists and is already open, so an utterance naming a note the vault does not hold ends the turn having written nothing.

A command is the only thing that creates one today, and only incidentally: daily-notes creates today's note as a side effect of opening it. That route is about to close.

## Motivation

### Turning Commands Off Leaves No Way To Create

Running a command opens a note in the active leaf. On mobile that pulls the screen off the chat panel and onto the note, mid-turn, which is the jerk Ilya wants gone. Emptying commandAllowList removes it.

It also removes the only creating call the model has. ToolCatalogue.forCapabilities (Engine Tools) drops run_command when no command is allowed, and nothing in the remaining set writes a file that is not already there.

So a vault with commands off can edit any note and create none. An utterance asking for a note that does not exist has no route: glob_notes finds nothing, open_note refuses a path no search returned, and the edit tools need a target the session is bound to.

### A Creating Tool Names Its Own Path

A command decides where its note goes; Obsidian owns the folder and the filename, and the model learns the path from the result. A tool creating a note has no such authority to borrow, so the model supplies the path.

That is the whole risk of this feature. A model writing a path from a spoken title can land the note in the wrong folder, under a name that does not match the vault's convention, or outside the folder the user meant. None of those is destructive, but each leaves a stray note the user has to find and delete.

The vault's naming convention is discoverable. glob_notes exists to show it: a folder listing tells the model how this vault spells a date and a title, which is what the tool's description already tells it to read before guessing a filename.

### Creating Is Consent The User Gives, Not The Model

Choosing an existing note is a choice among paths the vault returned. Creating one is a path the model invented, so the user is the only party who can say it is right.

The plugin already has this act. NoteChoiceService.confirmsWrite (Engine Waiting) parks a whole-note write on the user, offering the path and taking their pick as permission. A create is the same shape: one path, one confirmation, nothing recorded for a later turn to reuse.

## In Scope

- A create_note tool, taking one path from the vault root, that creates the note, opens it, and makes it the note the edit tools write to. Added to TOOL_SCHEMAS and to ToolCall (Model Providers) as its own predicate.
- Create the note empty. Content reaches it through the edit tools, so the create and the write are separate steps and an insert_at into a new note reads the same as one into an old note.
- Create the folders the path names that do not exist, to any depth, per D1. The confirmation shows the whole path, so the depth is something the user reads rather than something the model decides.
- Refuse a path where a note already exists, naming it, and say the note can be opened and edited instead. The refusal reads as a route rather than a dead end, matching the shape of the refusals in ToolDispatcher (Engine).
- Confirm the path with the user before anything is created, through the mechanism confirmsWrite uses. A decline creates nothing and is a tool result, not an exception.
- Refuse a path that is not a note under the vault root: no leading slash, no `..` segment, and a `.md` extension. The model writes this path from an utterance, so the tool validates rather than trusting it.
- Offer create_note only where search is enabled, per D2. It joins SEARCH_TOOLS in ToolCatalogue (Engine Tools), and is refused by name in HarnessToolsService (Engine Tools) as the other search tools are.
- Carry applicable_skills, per D3. Creating a note is a first vault act like a glob or a command, and a skill is where a vault says which folder a new note of a kind belongs in.
- Tell the model in the system prompt: list the folder before creating, so the path follows the vault's convention rather than a title said out loud. The search section is the home, since the tool arrives with search.
- Re-record the release 3 prompt fixture deliberately if the wording lands in a section a bare vault renders, per CLAUDE.md.

## Out of Scope

- Creating a folder on its own. A folder with no note in it is not something an utterance asks for, and the path of the note is what says which folders are needed.
- Deleting, renaming or moving a note. Each is destructive where a create is not, and the confirmation this spec builds is sized for an act that destroys nothing.
- Making the note from a template. Obsidian's templating is a command, and this spec exists because commands are being turned off.
- Removing daily-notes from DEFAULT_SETTINGS (Settings). Ilya is turning commands off in his own vault; shipping that default to everyone is a separate call.

## References

### Task

- [src/engine/tools/tool-schemas.ts](../../../../src/engine/tools/tool-schemas.ts) - open first: every tool's schema, and ToolCatalogue, which decides which are offered for a vault's capabilities
- [src/engine/tools/harness-tools-service.ts](../../../../src/engine/tools/harness-tools-service.ts) - where a vault-reaching tool is dispatched and where a disabled flow is refused a second time
- [src/engine/waiting/note-choice-service.ts](../../../../src/engine/waiting/note-choice-service.ts) - confirmsWrite, the confirmation a create reuses, and what it deliberately does not record
- [src/engine/tool-dispatcher.ts](../../../../src/engine/tool-dispatcher.ts) - how an opened note becomes the turn's target, in moveSessionTargetNoteTo

### Architecture

- [docs/architecture/6-reaching-a-note.md](../../../../docs/architecture/6-reaching-a-note.md) - open first of the two: how a note becomes the one a turn writes to, which is what a create has to end by doing
- [docs/architecture/2-vocabulary.md](../../../../docs/architecture/2-vocabulary.md) - open before naming anything a turn or a step in the design
