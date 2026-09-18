<img src="docs/assets/tyto-logo.png" alt="Tyto" width="200">

# Tyto

Talk to your notes and they change. Say "rename heading Budget to Costs" or "add apples, bananas and pears under Shopping", and the edit lands in the note you are looking at.

Other voice plugins transcribe what you say into the note. Tyto treats what you say as an instruction about the note. There is no fixed command phrasing to learn, and no chat window to copy an answer out of.

## Table of Contents

1. [Why Tyto](#why-tyto)
2. [What It Can Do](#what-it-can-do)
3. [It Can Get It Wrong](#it-can-get-it-wrong)
4. [What It Does Not Do](#what-it-does-not-do)
5. [What Leaves Your Vault](#what-leaves-your-vault)
6. [Getting Started](#getting-started)
7. [Commands and Search](#commands-and-search)
8. [Skills and Folder Instructions](#skills-and-folder-instructions)
9. [On Mobile](#on-mobile)
10. [Troubleshooting](#troubleshooting)
11. [Contributing and Releasing](#contributing-and-releasing)

## Why Tyto

Voice as an instruction, not dictation

- Speech-to-text plugins capture words. Tyto parses intent and edits structure: headings, lists, and blocks.

Edits you can usually undo

- A change to a note open in a tab goes through the editor, so Ctrl+Z and Cmd+Z step back through them one at a time. Not every edit can take that route: some are written to the file directly and cannot be undone. See [Not every edit is undoable](#not-every-edit-is-undoable).

It finds the note itself

- Tyto can run an Obsidian command you have allowed, search the vault for the note you meant, and edit there. Where several notes match, it asks which one.

Built for a phone

- The panel is a sidebar drawer, one tap from the mobile toolbar. Adding to a shopping list while walking is the case it is designed around.

Small and legible

- Four runtime dependencies, no database, no embedding index. Vault search reads notes directly.

## What It Can Do

Edit the note you are on

- Replace text, insert at a heading or a line, or write a whole note. One utterance can touch several notes.

Answer a question from the vault

- "What did I write about the roofing quote recently" returns a summary in the panel, naming the notes it read. Nothing is written.

Reach a note you did not open

- By command, by path, by glob, or by a date phrase. "Saturday last week" resolves to a real date before any filename is guessed.

Suggest tags the vault already uses

- Tyto reads Obsidian's tag index rather than inventing a tag, so a suggestion matches what the rest of the vault is filed under.

Follow the vault's own instructions

- Skills and AGENTS.md files tell the model how this vault writes. See [Skills and Folder Instructions](#skills-and-folder-instructions).

Keep the session across a reload

- The conversation is restored when Obsidian restarts, so a phone evicting the app does not lose the thread. Reset clears it.

Show its working

- Each turn lists the steps it spent against its budget. Turning on the transcript adds a copy button that puts the whole session on the clipboard as Markdown.

## It Can Get It Wrong

A model decides what your instruction meant, and a model is not deterministic. The same words can produce a different edit on a different day. Tyto is built so that a wrong edit is easy to spot, and usually easy to reverse. It cannot stop one happening.

### What can go wrong

- The transcriber mishears a name, and the search that follows looks for a word you never said.
- The model picks the wrong heading, the wrong list, or the wrong note, especially where several plausibly match.
- The model answers a question from the notes it happened to read rather than the best ones.
- A long instruction spends its step budget part-done, having made some of its edits and not the rest.

### Not every edit is undoable

Tyto writes two ways, and only one of them can be undone.

- Through the editor, where Ctrl+Z and Cmd+Z step back through a turn one edit at a time. This needs the note open in a tab that is still showing it and whose text matches the file on disk.
- Straight to the file, used whenever the editor route is not available. Obsidian's undo history never sees the change, so Ctrl+Z will not take it back.

A direct write is what happens when the note has no tab open, when the tab moved to another note mid-turn, or when a tab is still loading and holds text the file does not. Editing a note the model found by search is the common case: it was not open, so it was written directly.

Tyto tells you when this happened. The step that made the edit reads "Undo not available" in the panel and names the note underneath, because that edit is the one you may have to reverse by hand. Reverse it by editing the note yourself, or from your vault's backup or version control.

### What limits the damage

- Tyto writes nothing outside the note it is on unless a command, a search or your own pick sends it elsewhere. Search is off by default.
- An answer drawn from search is shown in the panel and never written into a note. An instruction that asks for both an answer and an edit still edits.
- The panel lists each step as it runs. The turn is labelled with the note it is on, and a step shows its own path whenever it edited a different note or wrote directly, so a wrong target is visible rather than silent.
- Where several notes match, the default is to ask you which. The pick is also the permission to write.

### What to do about it

- Read the panel after a turn rather than trusting it. The note names are there for exactly this.
- Undo immediately if an edit is wrong. The further you get from the turn, the more history you step back through.
- Treat an answer as a pointer to the notes it cites, not as the last word.
- Keep the vault in version control or on Obsidian Sync, as you would for any plugin that writes.

## What It Does Not Do

- Mistral only, using your own API key. There is no other provider and no local model.
- Manually tested against mistral-medium-latest, which is the default. The model is a free text field, so another Mistral model will run, but nothing else has been through the acceptance checks and a smaller model is likelier to mistake the instruction.
- One turn has a step budget, twenty by default. A long instruction that runs out reports what it did rather than continuing.
- One recording per request, up to the provider's limits: currently 60 minutes or 500 MB, though Tyto tracks Mistral's latest transcription model, so that can move. A longer recording is rejected rather than split, and the panel offers a retry rather than losing the audio. Normal dictation is nowhere near either, since five minutes is about 1 MB.

Specs live in docs/spec, in three buckets: [1-upcoming](docs/spec/1-upcoming) is designed but unbuilt, [2-active](docs/spec/2-active) is in flight, and [3-archived](docs/spec/3-archived) is what shipped.

## What Leaves Your Vault

Tyto sends note content to a remote service. This section says what, when, and to whom.

The service

- Mistral, at api.mistral.ai. Nothing is sent anywhere else.

What is sent

- Your spoken audio, so it can be transcribed.
- The instruction, the text of the note the session is on, any skill the turn matched, any AGENTS.md or CLAUDE.md in that note's folder chain, and search excerpts when vault search is on.

When

- Only during a turn you start, by recording or by typing an instruction. Nothing is sent in the background, and nothing is sent while the panel sits idle.

Why

- Tyto is an instruction parser, and the parsing is the model's. Turning free speech into a structural edit is what the model does, and no local model does it.

The account

- A Mistral API key is required. Without one Tyto does nothing.
- The key is stored in the plugin's folder inside your vault, and is sent only to Mistral.

The clipboard

- Off by default. Turning the transcript on adds a copy button, which puts the turn's text on your clipboard. That text includes note content and any vault instructions the turn read.

What never leaves

- No telemetry, no analytics, and no host other than Mistral.

What it can do in the vault without being configured

- Run one Obsidian command, daily-notes, which creates or reveals your daily note. Nothing else is allowed until you add it. See [Commands and Search](#commands-and-search).
- Vault search is off by default, so nothing beyond the note in the session is read.

## Getting Started

Tyto needs a Mistral API key. Create one at console.mistral.ai, then open Settings, Tyto, and paste it into Mistral API key. Nothing works without it.

Then try a turn. Use a scratch note for these six, not one you care about: the point is to watch what an edit looks like before you trust it with anything.

1. Open the note and click the mic ribbon icon, or run "Tyto: Start session". The session panel opens in the right sidebar.
2. Type an instruction first, to prove the loop without the mic: "add a heading called Test at the start of the file", then Send.
3. Click Mic, say "rename heading Test to Done", click Stop. The transcript appears, then the edit lands.
4. Try dictation: "make a list of apples, bananas and pears under a heading called Shopping".
5. Try a follow-up: "actually make that heading level two".
6. Press Ctrl+Z / Cmd+Z in the note: the last edit undoes through the native history.

If a step fails, the panel shows an error entry naming the failing step: transcription, chat, or apply. If a step succeeds but does the wrong thing, see [It Can Get It Wrong](#it-can-get-it-wrong).

Commands and vault search are both off until you turn them on. See [Commands and Search](#commands-and-search).

## Commands and Search

Tyto can run an Obsidian command and then edit the note it opened, and it can search the vault to answer a question.

- Say "open my daily note and add a paragraph under Meetings". The note opens, the session moves to it, and the edit lands there.
- Say "what did I write about the roofing quote recently". The panel shows a copyable summary naming the notes it drew on. Nothing is written to a note.

Tyto runs only the commands you allow. Settings holds one command id or namespace pattern per line, and a collapsed count showing what those entries currently resolve to. A pattern's plugin id must be literal, and only a trailing wildcard is allowed.

The list ships holding daily-notes, so "open my daily note" works out of the box. Opening the daily note creates or reveals one note and destroys nothing, which is what makes it safe to allow unasked. Clear the line to allow nothing.

Write daily-notes for a single command, and open-or-create-file-command:* for every command in a namespace. Obsidian's core commands are not namespaced, so daily-notes:* matches none of them.

Search is a toggle in settings, off by default. With both off, Tyto reads and edits only the note the session is on.

Where a search finds several candidates, Tyto lists them and waits for you to pick. The pick is both which note and permission to write to it.

## Skills and Folder Instructions

Two ways to tell Tyto how this vault writes, so an instruction does not have to repeat the house style every time.

Skills

- Markdown files in the skills folder set in settings, each with a name and a description in its frontmatter. The description is what the model matches an utterance against, and a matched skill is read before the edit lands.

AGENTS.md and CLAUDE.md

- Picked up from the folder chain above the note being written. Unlike a skill, these apply to every write under that folder rather than being matched per utterance.

Neither can widen what the plugin does. A skill naming a tool outside Tyto's own set finds nothing to call.

## On Mobile

The session panel opens as a drawer from the right sidebar. To reach it in one tap, add the command to the mobile toolbar: Settings, Mobile, Manage toolbar options, then add "Tyto: Start session".

Recording stops if you leave Obsidian, because a backgrounded recording captures silence. What was said up to that point is transcribed and acted on rather than discarded, so a locked screen costs the rest of the sentence instead of the whole dictation. Closing the panel does the same.

Collapsing the sidebar is not closing the panel. The recording keeps running, and nothing is sent until you stop it.

The allowed-command list is a plain text box, and the resolved list stays collapsed, so neither fills a phone screen.

Skills must live in a normal vault folder. Obsidian Sync copies no dot-folder to a phone, so a skills path starting with a dot gives an empty catalogue on mobile.

## Troubleshooting

- Mic errors: macOS needs microphone permission for Obsidian under System Settings, Privacy and Security.
- 401 errors: check the API key in settings.
- "Undo not available" on an edit: the edit could not go through the editor, so it was written to the file directly. It landed, and Ctrl+Z will not take it back. See [Not every edit is undoable](#not-every-edit-is-undoable).
- "is not a markdown note": the session is on a canvas, a PDF or a Bases file, which have no editor to write through. Press Reset and start on a note.
- A turn that stops short: it spent its step budget. Raise the budget in settings, or split the instruction in two.
- No skills on mobile: check the skills path in settings is a normal folder, not a dot-folder.

## Contributing and Releasing

Building from source, running the suite and installing a development build are in [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md). Cutting a release is in [docs/RELEASE.md](docs/RELEASE.md).
