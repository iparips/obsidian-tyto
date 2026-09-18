---
created: 2026-09-18
updated: 2026-09-18
---

# Implementation Order

One commit left, then a sequence run by hand. It is independent of the release, so it can land alone.

## 1. Silence the Console Again (done)

Landed in 92db8b0. The two console.debug calls are out of WorkspaceNoteLocator (engine/note-binding), with the loop and both return paths unchanged. Verify is green and the grep over src outside tests and test-support returns nothing.

## 2. Make the Licence Detectable

Owned by D1, which is open. Try the cheap experiment first.

- Move Ilya's copyright line to sit inside the AGPL's own instantiation template near the end, in place of `Copyright (C) <year> <name of author>`, leaving the licence body's opening text as the first thing in the file.
- Push, then re-read `gh repo view --json licenseInfo`. GitHub re-runs detection on a push to the default branch.
- If it still reports Other, stop and record that in D1 rather than reshaping the file further. It does not block the submission.

Exit test: the repo page sidebar reads AGPL-3.0, or D1 records that it does not and why.

## Before Submitting

Not commits. Each is done once, by hand, in this order.

### Set the repo metadata

```bash
gh repo edit iparips/obsidian-tyto \
  --description "Edit your notes by voice. Speak an instruction and the note changes, with no fixed command phrases." \
  --add-topic obsidian --add-topic obsidian-plugin --add-topic obsidian-md
```

### Cut the release

main is in sync with origin and its last Build run was green, so the branch already holds the tree the directory will read.

docs/RELEASE.md owns the six steps. The two that matter to the directory:

- The tag matches the manifest version exactly, with no `v` prefix. The workflow fails the run when they disagree, which is the guard rather than the check.
- The release is created rather than published from a draft, because the workflow triggers on `release: created`.

### Submit

At community.obsidian.md, with the GitHub account linked:

- Owner set to Ilya.
- Payment category set to Optional payment, because the plugin needs a paid third-party key.
- Read the scan result, which arrives within minutes, and fix what it raises before the 24 hours that puts the listing in the app.
