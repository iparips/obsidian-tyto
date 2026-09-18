---
created: 2026-09-18
updated: 2026-09-18
---

# Implementation Order

Two commits, then a sequence run by hand. The commits are independent of each other and of the release, so either can land alone.

## 1. Silence the Console Again

The only code change in this spec.

- Remove the two console.debug calls in WorkspaceNoteLocator (engine/note-binding), at workspace-note-locator.ts:66 and :70.
- Keep the loop, the re-read after the load, and both return paths unchanged. The comments explaining why the view is re-read stay.

Exit test: `bun run verify` is green, and the grep for console in src outside tests and test-support returns nothing.

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

### Push main

Ten commits are unpushed, and main has no upstream. The directory reads the manifest from the default branch, so the branch must hold the verified tree before anything else.

```bash
git push -u origin main
```

Confirm the Build workflow goes green on the push before cutting the release. A red CI run at the tag is the failure this ordering avoids.

### Cut the release

docs/RELEASE.md owns the six steps. The two that matter to the directory:

- The tag matches the manifest version exactly, with no `v` prefix. The workflow fails the run when they disagree, which is the guard rather than the check.
- The release is created rather than published from a draft, because the workflow triggers on `release: created`.

### Submit

At community.obsidian.md, with the GitHub account linked:

- Owner set to Ilya.
- Payment category set to Optional payment, because the plugin needs a paid third-party key.
- Read the scan result, which arrives within minutes, and fix what it raises before the 24 hours that puts the listing in the app.
