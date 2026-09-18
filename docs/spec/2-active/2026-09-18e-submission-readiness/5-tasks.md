---
created: 2026-09-18
updated: 2026-09-18
---

# Implementation Order

No commits left. What remains is the sequence run by hand.

## 1. Silence the Console Again (done)

Landed in 92db8b0. The two console.debug calls are out of WorkspaceNoteLocator (engine/note-binding), with the loop and both return paths unchanged. Verify is green and the grep over src outside tests and test-support returns nothing.

## 2. Make the Licence Detectable (done)

Landed in fea533f, with both causes recorded in D1. The body is byte for byte the canonical AGPL, the notice fills the licence's own instantiation template, and .prettierignore keeps prettier off the file.

Exit test: the repo page sidebar reads AGPL-3.0 once the branch is pushed, since GitHub re-runs detection then. Still Other after that is recorded in D1 rather than reshaped further, and does not block the submission.

## Before Submitting

Not commits. Each is done once, by hand, in this order.

### Set the repo metadata (done)

The description and topics are live on the repo. One topic is wrong and worth
correcting: text-to-speech is synthesis, the opposite of what Tyto does. The
term for reading speech into text is speech-to-text.

```bash
gh repo edit iparips/obsidian-tyto \
  --remove-topic text-to-speech --add-topic speech-to-text
```

### Cut the release

Push first: the licence fix is local, and GitHub re-runs licence detection on a push to the default branch. Confirm the Build workflow is green before tagging.

docs/RELEASE.md owns the six steps. The two that matter to the directory:

- The tag matches the manifest version exactly, with no `v` prefix. The workflow fails the run when they disagree, which is the guard rather than the check.
- The release is created rather than published from a draft, because the workflow triggers on `release: created`.

### Submit

At community.obsidian.md, with the GitHub account linked:

- Owner set to Ilya.
- Payment category set to Optional payment, because the plugin needs a paid third-party key.
- Read the scan result, which arrives within minutes, and fix what it raises before the 24 hours that puts the listing in the app.
