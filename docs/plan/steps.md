# Objectives

The build order for [2-plan.md](releases.md), cut into sittings of two to three hours. Each line is one sitting that leaves something working. Tick them in order to see where the project stands.

Sizing comes from this repo's own history. A spec is about an hour, a feature built on a written spec is two to three, and a polish pass is one. Sittings that carried more than one feature are split.

## Table of Contents

1. [Where things stand](#where-things-stand)
2. [A. Close out what is built](#a-close-out-what-is-built)
3. [B. Survive a phone](#b-survive-a-phone)
4. [C. Make it safe for a stranger](#c-make-it-safe-for-a-stranger)
5. [Submission](#submission)
6. [D. Desktop V1, built during review](#d-desktop-v1-built-during-review)
7. [E. Streaming on the phone](#e-streaming-on-the-phone)
8. [F. Lift the one-note limit](#f-lift-the-one-note-limit)

## Where things stand

Features 1 to 10 and 14 are built, and the suite is green at 854 tests across 70 files. Unbuilt specs live under [spec/Upcoming](../spec/Upcoming), which is why they carry no number: numbering them forces a renumber every time one ships.

Feature 10 is done, despite its spec saying otherwise. glob_notes and grep_notes are both routed in HarnessTools (Engine), PathPattern, NoteGlob, NoteGrep, ResultOrder and GrepRequest (Search) all ship with tests, VaultSearch is gone, and two tests assert search_vault no longer exists. Only the status lines in its index and implementation order are stale.

The largest risk to a submission is the backlog of unrun manual exit tests. Six features are marked built with theirs outstanding.

## A. Close out what is built

Code is ahead of the specs and ahead of the manual tests. Both gaps get more expensive the longer they sit, because the next feature gets designed against a document that no longer matches the code.

| Sitting | Objective                                              | Scope |
| ------- | ------------------------------------------------------ | ----- |
| A1      | Reconcile the finding-notes spec with the code         | 1 h   |
| A2      | Run the exit tests for features 10 and 14              | 2 h   |
| A3      | Fix what those exit tests find                         | 3 h   |
| A4      | Run the outstanding exit tests for features 4, 6, 8, 9 | 2 h   |

A1 covers both index files, the twelve steps in the implementation order, and marking the superseded search flow in the harness spec.

A2 records failures as manual-test scenarios rather than fixing them. Fixing while testing loses the list.

## B. Survive a phone

Mobile is the case the plugin is designed around. A session that vanishes when the app backgrounds is the first bug a reviewer hits.

| Sitting | Objective                                                       | Scope |
| ------- | --------------------------------------------------------------- | ----- |
| B1      | Session persistence, first commit: serialise and restore        | 3 h   |
| B2      | Session persistence, second commit: interrupted turns and reset | 2 h   |
| B3      | Run the whole manual-test folder on a phone                     | 3 h   |
| B4      | Fix the mobile failures                                         | 3 h   |

B1 and B2 follow the two commits in [session-persistence/5-implementation-order.md](../spec/Upcoming/session-persistence/5-implementation-order.md).

## C. Make it safe for a stranger

Everything here exists because someone who is not the author will install this. A stranger has no API key, no allow-list, and no patience for an edit landing in the wrong note.

| Sitting | Objective                                   | Scope |
| ------- | ------------------------------------------- | ----- |
| C1      | First-run onboarding when no API key is set | 3 h   |
| C2      | Harden every error path                     | 3 h   |
| C3      | Audit against the plugin review guidelines  | 2 h   |
| C4      | Public README and privacy statement         | 2 h   |
| C5      | Demo clip and screenshots, both surfaces    | 2 h   |

C2 covers a bad key, a network drop, a rate limit and a malformed tool call. Each produces a panel entry naming the failing step, and none leaves the panel stuck pending (NFR5).

C3 covers no innerHTML, async onload, no global style leakage, and a detach that cleans up every listener. Steps 2 and 5 of [mobile-v1/4-release-checklist.md](../spec/Upcoming/mobile-v1/4-release-checklist.md) cover C3 and C4.

## Submission

Submit at the end of C, thirteen sittings in. The loop works, it works on a phone, it survives being backgrounded, it fails legibly, and it says where the audio goes. That is enough.

Tag 1.0.0 with one provider and no streaming. A second provider doubles the surface to keep working while learning what real users break.

Review takes weeks and is outside your control. Milestone D is what to build during it.

## D. Desktop V1, built during review

Steps 2 to 5 of [desktop-v1/7-implementation-order.md](../spec/Upcoming/desktop-v1/7-implementation-order.md) are independent once the contracts land, so these sittings can be reordered after D1.

| Sitting | Objective                                    | Scope |
| ------- | -------------------------------------------- | ----- |
| D1      | Realtime contracts and widened settings      | 2 h   |
| D2      | Mistral realtime session and direct-key auth | 3 h   |
| D3      | Downsampler and streaming transcriber        | 3 h   |
| D4      | Live partials in the panel                   | 3 h   |
| D5      | OpenAI as the second provider                | 3 h   |
| D6      | Review mode: diff preview, accept and reject | 3 h   |
| D7      | Settings for the widened surface             | 2 h   |

D7 covers the provider dropdown, both keys, language, microphone, the review toggle, and the frontmatter language override.

## E. Streaming on the phone

The mobile half of streaming, which needs ephemeral tokens rather than a raw key. Ships as 1.1.0 into a plugin already listed.

| Sitting | Objective                           | Scope |
| ------- | ----------------------------------- | ----- |
| E1      | Ephemeral token auth                | 3 h   |
| E2      | Fallback to batch when a mint fails | 2 h   |
| E3      | Mobile exit test, then tag 1.1.0    | 2 h   |

## F. Lift the one-note limit

Last, deliberately. Writing to notes the user is not looking at is where a voice plugin does real damage, so it goes to an audience that already trusts the single-note behaviour.

| Sitting | Objective                                     | Scope |
| ------- | --------------------------------------------- | ----- |
| F1      | Finish the cross-file skills spec             | 2 h   |
| F2      | Read a named note beyond the session note     | 3 h   |
| F3      | Create and append, with an undo story         | 3 h   |
| F4      | Per-target AGENTS.md and narrowed refusals    | 2 h   |
| F5      | Exit test against the host vault's own skills | 2 h   |

F1 gives feature 13 a testing strategy and an implementation order, matching every other spec folder.

F3 needs a documented answer for undo, since vault.modify bypasses the editor history that NoteEditor (Engine) relies on.

## The rule that keeps A from re-forming

A feature is not built until its exit test has been run once. Six features reached "built, exit test pending" at the same time, which is why milestone A exists.
