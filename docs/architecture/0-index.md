# Architecture

Entry point for the architecture docs. Two groups: one design per release, then
the cross-cutting docs that belong to no release.

Numbers are permanent. Archived specs and commit messages cite them, so a new
doc takes the next number rather than a renumber, and this index takes 0.

## Cross-cutting

Read these first. They hold the vocabulary and the boundaries every release
design assumes.

- [7-package-design.md](7-package-design.md) - what each package owns, which way dependencies run, and the two open cycles
- [12-the-panel-vocabulary.md](12-the-panel-vocabulary.md) - turn, turn step and progress line, the entry kinds, and the words this codebase settles on
- [9-an-utterance-and-its-answer.md](9-an-utterance-and-its-answer.md) - how one instruction reaches the engine and how the ending comes back
- [11-the-two-records.md](11-the-two-records.md) - the chat history and the panel entries, and where the two meet
- [10-asking-the-model.md](10-asking-the-model.md) - the object graph behind one model call
- [8-parking-a-turn.md](8-parking-a-turn.md) - how a turn suspends to wait for the user, and unwinds when they stop it

## Per release

Each is a delta on the one before it, so only the first is a whole design. The
releases themselves are in [../plan/releases.md](../plan/releases.md).

- [1-desktop-mvp.md](1-desktop-mvp.md) - the full loop on desktop, record then transcribe
- [2-mobile-mvp.md](2-mobile-mvp.md) - the same loop on iOS and Android
- [3-agents-md-loading.md](3-agents-md-loading.md) - standing instructions a folder sets for the notes inside it
- [4-obsidian-agent-harness.md](4-obsidian-agent-harness.md) - running commands, rebinding to the note one opens, and searching the vault
- [5-desktop-v1.md](5-desktop-v1.md) - realtime capture, the OpenAI provider, review-first mode
- [6-mobile-v1.md](6-mobile-v1.md) - streaming on mobile, ephemeral tokens, the public release
