# Obsidian Owl

Talk to your notes and they change. Say "rename heading Budget to Costs" or "add apples, bananas and pears under Shopping", and the edit lands in the note you are looking at.

Other voice plugins transcribe what you say into the note. Owl treats what you say as an instruction about the note. There is no fixed command phrasing to learn, and no chat window to copy an answer out of.

## Table of Contents

1. [Why Owl](#why-owl)
2. [What it does not do](#what-it-does-not-do)
3. [Install for Development](#install-for-development)
4. [Test It Out](#test-it-out)
5. [Commands and Search](#commands-and-search)
6. [On Mobile](#on-mobile)
7. [Troubleshooting](#troubleshooting)
8. [Releasing](#releasing)

## Why Owl

Voice as an instruction, not dictation

- Speech-to-text plugins capture words. Owl parses intent and edits structure: headings, lists, and blocks.

Edits you can undo

- Changes go through the editor, so Ctrl+Z and Cmd+Z step back through them one at a time. Owl does not overwrite the file behind your back.

It can open the note first

- Owl runs an Obsidian command you have allowed, follows the note it opens, and edits there. See [Commands and Search](#commands-and-search).

Built for a phone

- The panel is a sidebar drawer, one tap from the mobile toolbar. Adding to a shopping list while walking is the case it is designed around.

Small and legible

- Two runtime dependencies, no database, no embedding index. Vault search reads notes directly.

## What it does not do

- One note at a time. No multi-note refactors.
- Mistral only, using your own API key.
- Conversation history lives in memory. Edits are saved to the note, but a reload clears the chat.

Specs live in [docs/spec](docs/spec/1-requirements.md).

## Install for Development

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for prerequisites, build commands, and how to symlink the repo into a vault.

## Test It Out

1. Open any note and click the mic ribbon icon, or run "Start session for active note". The session panel opens in the right sidebar.
2. Type an instruction first, to prove the loop without the mic: "add a heading called Test at the start of the file", then Send.
3. Click Mic, say "rename heading Test to Done", click Stop. The transcript appears, then the edit lands.
4. Try dictation: "make a list of apples, bananas and pears under a heading called Shopping".
5. Try a follow-up: "actually make that heading level two".
6. Press Ctrl+Z / Cmd+Z in the note: the last edit undoes through the native history.

If a step fails, the panel shows an error entry naming the failing step: transcription, chat, or apply.

## Commands and Search

Owl can run an Obsidian command and then edit the note it opened, and it can
search the vault to answer a question.

- Say "open my daily note and add a paragraph under Meetings". The note opens,
  the session moves to it, and the edit lands there.
- Say "what did I write about the roofing quote recently". The panel shows a
  copyable summary naming the notes it drew on. Nothing is written to a note.

Owl runs only the commands you allow. Settings holds one command id or namespace
pattern per line, such as daily-notes:*, and a collapsed count showing what those
entries currently resolve to. A pattern's plugin id must be literal, and only a
trailing wildcard is allowed. Leave the list empty to allow no commands.

Search is a checkbox in settings. With commands off and search off, Owl behaves
exactly as it did before this release.

## On Mobile

`./install` rebuilds and copies the plugin into the vault, which is what a phone needs: Obsidian Sync does not follow symlinks. See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

The session panel opens as a drawer from the right sidebar. To reach it in one tap, add the command to the mobile toolbar: Settings, Mobile, Manage toolbar options, then add "Owl: Start session for active note".

Recording stops if you leave Obsidian. The partial audio is discarded and the panel returns to idle, because a backgrounded recording captures silence.

The allowed-command list is a plain text box, and the resolved list stays
collapsed, so neither fills a phone screen.

Skills must live in a normal vault folder. Obsidian Sync copies no dot-folder to a phone, so a skills path starting with a dot gives an empty catalogue on mobile.

## Troubleshooting

- Mic errors: macOS needs microphone permission for Obsidian under System Settings, Privacy and Security.
- 401 errors: check the API key in settings.
- "note is not open in an editor": the session's note must stay open in a tab while you edit.
- No skills on mobile: check the skills path in settings is a normal folder, not a dot-folder.

## Releasing

See [docs/RELEASE.md](docs/RELEASE.md).
