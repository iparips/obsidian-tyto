# Plan

What has shipped, and what is left before the community store listing.

Four releases are built. The goal is milestone C, which ships 1.0.0 with one
provider and no streaming. Streaming follows as 1.1.0, into a plugin already
listed.

Each milestone file below holds both its goal and its sittings, cut to two or
three hours. Sizing comes from this repo's own history: a spec is about an
hour, a feature built on a written spec is two to three, and a polish pass is
one.

- [2-close-out.md](2-close-out.md) - milestone A, the active specs and the exit tests owed
- [3-survive-a-phone.md](3-survive-a-phone.md) - milestone B, the mobile pass
- [4-safe-for-a-stranger.md](4-safe-for-a-stranger.md) - milestone C, then the 1.0.0 submission
- [5-streaming.md](5-streaming.md) - milestone D, streaming on both surfaces, then 1.1.0

## What Has Shipped

Releases 1 to 4. Each has its spec folder in
[spec/3-archived](../spec/3-archived), which is the record of what was built
and why.

1. Desktop MVP. The core loop: speak an instruction, see the note change.
   Record-then-transcribe capture, anchored edits, a sidebar panel, Mistral as
   the only provider, and the vault's single-note skills.
2. Mobile MVP. The same loop on a phone, through a slide-over drawer.
3. AGENTS.md loading. A folder sets the standing instructions for the notes
   inside it, walked root-first so the nearest folder wins.
4. Obsidian agent harness. The session stops being trapped in one note.
   Commands behind an allow-list, glob and grep over the vault, and the user
   picking the note from a shortlist.

Release 4 has grown well past its original spec. Twenty-odd follow-ups sit
beside it in the archive, covering session persistence, what a session binds
to, cancelling a turn, and what the panel reports. Read the archive rather
than a list here, which is the thing that drifts.

## What Is Not Planned

Cross-file skills: writing to notes beyond the one the session is on. The
design exists at
[cross-file-skills/1-index.md](../spec/1-upcoming/2026-09-14a-cross-file-skills/1-index.md)
and is not scheduled.

Writing to notes the user is not looking at is where a voice plugin does real
damage, and the single-note refusal is honest about the limit. If it is ever
picked up, it goes to an audience that already trusts the single-note
behaviour.

## The Rule That Keeps Milestone A From Re-Forming

A feature is not built until its exit test has been run once. Five features
reached "built, exit test pending" at the same time, which is why milestone A
exists at all.
