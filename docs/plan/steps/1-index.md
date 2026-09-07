# Objectives

The build order for [releases.md](../releases.md), cut into sittings of two to
three hours. Each line is one sitting that leaves something working.

Sizing comes from this repo's own history. A spec is about an hour, a feature
built on a written spec is two to three, and a polish pass is one.

- [2-close-out.md](2-close-out.md) - milestone A, the exit tests owed on built features
- [3-survive-a-phone.md](3-survive-a-phone.md) - milestone B, session persistence and the mobile pass
- [4-safe-for-a-stranger.md](4-safe-for-a-stranger.md) - milestone C, then the 1.0.0 submission
- [5-desktop-v1.md](5-desktop-v1.md) - milestone D, streaming and a second provider, built during review
- [6-streaming-and-cross-file.md](6-streaming-and-cross-file.md) - milestones E and F, 1.1.0 and the one-note limit

## Where things stand

Every specced feature is built, and the suite is green at 861 tests across 70
files. Unbuilt specs live under [spec/Upcoming](../../spec/Upcoming), which is
why they carry no number: numbering them forces a renumber every time one ships.

The largest risk to a submission is the backlog of unrun manual exit tests.
Five features are marked built with theirs outstanding.

## Outline

- [x] A1 Reconcile the finding-notes spec with the code
- [ ] A2 Run the exit tests for features 10 and 14
- [ ] A3 Fix what those exit tests find
- [ ] A4 Run the outstanding exit tests for features 6, 8, 9
- [ ] B1 Session persistence: serialise and restore
- [ ] B2 Session persistence: interrupted turns and reset
- [ ] B3 Run the whole manual-test folder on a phone
- [ ] B4 Fix the mobile failures
- [ ] C1 First-run onboarding when no API key is set
- [ ] C2 Harden every error path
- [ ] C3 Audit against the plugin review guidelines
- [ ] C4 Public README and privacy statement
- [ ] C5 Demo clip and screenshots, both surfaces
- [ ] Submit and tag 1.0.0
- [ ] D1 Realtime contracts and widened settings
- [ ] D2 Mistral realtime session and direct-key auth
- [ ] D3 Downsampler and streaming transcriber
- [ ] D4 Live partials in the panel
- [ ] D5 OpenAI as the second provider
- [ ] D6 Review mode: diff preview, accept and reject
- [ ] D7 Settings for the widened surface
- [ ] E1 Ephemeral token auth
- [ ] E2 Fallback to batch when a mint fails
- [ ] E3 Mobile exit test, then tag 1.1.0
- [ ] F1 Finish the cross-file skills spec
- [ ] F2 Read a named note beyond the session note
- [ ] F3 Create and append, with an undo story
- [ ] F4 Per-target AGENTS.md and narrowed refusals
- [ ] F5 Exit test against the host vault's own skills

## The rule that keeps A from re-forming

A feature is not built until its exit test has been run once. Five features
reached "built, exit test pending" at the same time, which is why milestone A
exists.
