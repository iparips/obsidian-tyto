# Archived Specs

Built and shipped. Each folder is the spec as it was implemented, kept as the
record of what the code was asked to do and why.

Numbers are chronological and permanent. They are cited from commit messages,
the architecture docs and each other, so a shipped spec keeps its number even
when a later one supersedes it.

## Releases

- [1-desktop-mvp](1-desktop-mvp/1-index.md) - release 1, the core edit loop
- [2-mobile-mvp](2-mobile-mvp/1-index.md) - release 2, the same loop on a phone
- [3-agents-md-loading](3-agents-md-loading/1-index.md) - release 3, instructions a folder sets for the notes inside it
- [4-harness-mvp](4-harness-mvp/01-index.md) - release 4, commands, retargeting and search

## Features

- [5-settings-command-picker](5-settings-command-picker/1-index.md) - finding a command to allow without knowing its id
- [6-tidy-up-chat-panel](6-tidy-up-chat-panel/1-index.md) - three weights for six entry kinds, and a pending indicator
- [7-sessions-without-a-note](7-sessions-without-a-note/1-index.md) - starting a session with no note open
- [8-cancelling-a-turn](8-cancelling-a-turn/1-index.md) - stopping a running turn, and saying what it left
- [9-model-chosen-targets](9-model-chosen-targets/1-index.md) - opening a note the model located itself
- [10-finding-notes](10-finding-notes/1-index.md) - a glob over paths and a grep over content
- [14-choosing-the-note](14-choosing-the-note/1-index.md) - the user picks from a shortlist, which is also the permission to write
- [18-editing-what-was-chosen](18-editing-what-was-chosen/1-index.md) - writing to the note the user picked
- [19-relative-dates](19-relative-dates/1-index.md) - the week anchor and the date line
- [20-copy-transcript](20-copy-transcript/1-index.md) - filing a whole session as a document
- [21-relative-date-tool](21-relative-date-tool/1-index.md) - resolving a phrase like last Friday to a date
- [22-session-persistence](22-session-persistence/1-index.md) - a session that survives the app being backgrounded
- [23-tyto-logo](23-tyto-logo/1-index.md) - the ribbon mark and the icon it ships as
- [24-remembering-skills-read](24-remembering-skills-read/1-index.md) - a skill body read once stays read
- [25-opening-a-single-match](25-opening-a-single-match/1-index.md) - one candidate opens without asking
- [28-not-losing-a-recording](28-not-losing-a-recording/1-index.md) - anything that ends a recording other than the user sends what it captured
- [29-following-the-note-across-a-restore](29-following-the-note-across-a-restore/1-index.md) - a session binds to the note the user has open, restored or not

## Refactors

- [15-architecture-cleanup](15-architecture-cleanup/1-index.md) - splitting engine into concept sub-packages
- [16-oversized-files](16-oversized-files/1-index.md) - the eight files past the readability limits
- [17-layering](17-layering/1-index.md) - what the layer names map to, and the four things that do not
- [26-packages-over-the-limit](26-packages-over-the-limit/1-index.md) - four folders past the ten-file limit
- [27-wiring-and-entry-points](27-wiring-and-entry-points/1-index.md) - construction knowledge moves into a wiring package
