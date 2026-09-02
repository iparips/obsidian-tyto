# AGENTS.md Loading: Decisions

Choices made in [2-functional-requirements.md](2-functional-requirements.md), and what is still open.

## Decisions

The write target picks the chain, not the session. Instructions describe how a
note should be written, so they belong to the note receiving the edit. Keying
them to the session note would mean a journal entry filed from a project note
followed the project's rules, which is the opposite of what the folder asked
for. This release writes to one note per turn, so the two coincide today; the
axis is chosen now because release 7 makes them diverge.

Reads pull no instructions. A note the model consults for context is not being
written to, so its folder's rules do not govern the edit in hand. Excluding
reads also keeps a read from injecting instructions the user never aimed at
this turn, which matters once the model chooses what to read.

One instruction file per folder, AGENTS.md preferred, CLAUDE.md as the
fallback. Supporting both names lets a vault shared with Claude Code work
unchanged, and preferring the vendor-neutral one makes AGENTS.md the file to
write when starting fresh.

Taking only one is what makes symlinks safe. A CLAUDE.md symlinked to its
neighbour is a likely setup, and Obsidian's adapter exposes no inode or link
information to detect it with, so loading both would duplicate the same
instructions with no way to notice. One per folder sidesteps detection
entirely. The cost is that a folder whose two files genuinely differ silently
loses the CLAUDE.md, which is the MVP trade.

Nearest wins, by ordering rather than by merging. Merging would need the files
to share a structure, which markdown prose does not. Recency in the prompt is
the mechanism the model already responds to, and it costs nothing to implement.

Whole files load, unlike skills, which load by description. These files are
meant to be short and always apply, so there is nothing to route on. The cap in
FR9 keeps that affordable, set high enough to be a safety rail rather than a
limit on what a user may write.

The walk covers ancestors only. A file in a subfolder of the target does not
load, because the target is not inside that subfolder and its rules do not
apply.

## Open questions

Whether an empty AGENTS.md should suppress the folder's CLAUDE.md. The design
says yes, because the fallback turns on whether the read succeeded rather than
on what it returned, which is the simpler rule. The other reading is that an
empty file expresses nothing and so should fall through. Neither is clearly
right; settle it the first time a real vault hits the case.

Whether either filename suits a notes vault, where both are visible in the file
explorer and show up in search. FR2 lets a user pick the one they prefer, which
softens the question without answering it. A dot-prefixed name would hide the
file but Obsidian Sync will not copy it to a phone, so the remaining option is
a configurable name in settings.
