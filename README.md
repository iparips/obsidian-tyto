# Obsidian Owl

An Obsidian plugin that edits the active note from natural-language instructions, spoken or typed. Speak "rename heading Budget to Costs" or "add a list A, B, C under heading X" and the note changes. Dictated content lands formatted as markdown. Powered by Mistral speech-to-text and chat models, using your own API key.

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

Installing on a phone needs `./install --copy`, which rebuilds and copies the plugin into the vault. Obsidian Sync does not follow the symlink a normal install creates. See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

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
