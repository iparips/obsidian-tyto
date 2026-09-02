# AGENTS.md Loading: Requirements

Numbered requirements for the feature framed in [1-problem-and-goals.md](1-problem-and-goals.md).

## Functional requirements

FR1. For the note a turn writes to, walk the path from the vault root down to
the folder holding that note, taking one instruction file per folder.

FR2. Read AGENTS.md in a folder. Where a folder has none, read CLAUDE.md
instead. Never take both from one folder.

FR3. Include the vault root's own instruction file, and stop the walk there.
Never read above the vault root.

FR4. Order the files root first, nearest last, so the nearest folder's
instructions read last in the prompt.

FR5. Inject the loaded instructions as their own prompt section, placed after
the role and dictation rules and before the skill catalogue.

FR6. Mark each file's contents with the folder it came from, so the model can
tell a broad rule from a narrow one.

FR7. State in the section that later entries come from nearer folders and win
where they conflict with an earlier one. Ordering is the whole override
mechanism, so it cannot rest on the model inferring what the order means.

FR8. Resolve the chain per write target rather than per session, so a turn that
writes outside the session note's folder follows the destination's rules. This
release has one target per turn, the session note, so the target changes when
the session rebinds.

FR9. Apply a cap on the total loaded before ordering for the prompt. Select
from the nearest folder outward, stop once the next file would exceed the cap,
and drop the furthest. FR4 then orders whatever survives.

FR10. Report in the session panel which files applied to a turn, and say when
the cap dropped one.

FR11. Behave exactly as release 2 in a vault with neither file, producing the
same prompt byte for byte.

FR12. Treat an unreadable file, an empty one, or one holding only whitespace as
absent. Such a file is not a failure, and contributes no labelled section to the
prompt.

FR13. Apply only the target's own chain to a write. Do not carry a chain
resolved for one note into a write to another.

FR14. Show a notification when the cap drops a file, so a user who is not
watching the panel still learns their instructions were truncated.

FR15. Log to the console when the cap drops a file, naming every file dropped
and the folder each came from.

FR16. Notify once per resolved chain, not once per dropped file, so a deep
path over the cap produces one notification rather than several.

## Non-functional requirements

NFR1. Discovery costs at most two read attempts per ancestor folder, one per
filename, and no directory listing. A folder with an AGENTS.md costs one.

NFR2. Cache a resolved chain by folder path for the life of the session, so a
turn writing several notes in one folder walks that folder once and a long
session re-walks nothing.

NFR3. Instruction files are user content, not trusted input. An AGENTS.md
cannot grant the model a tool it does not have, widen the paths it may write,
or lift the single-note limit release 7 removes. A file reached only because
the model chose a write target cannot widen what the next write may touch.

NFR4. Discovery resolves through the vault adapter, so the same chain loads on
desktop and mobile.

NFR5. A cap notification is not an error. The turn proceeds on the chain that
fitted, and the panel entry for the turn is unchanged.

Decisions taken and questions still open: [5-decisions.md](5-decisions.md).
