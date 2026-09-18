---
created: 2026-09-18
updated: 2026-09-18
---

# Acceptance Criteria

## Setup

- The listing draft at community.obsidian.md, owned by Ilya
- A release cut after the fixes, with main.js, manifest.json and styles.css attached
- A local checkout on the Bun version build.yml pins

### The re-scan clears the description error

```gherkin
Given a release whose manifest.json names no Obsidian
When  the review runs against it
Then  the description error is gone
And   no new error names the description
```

### A rebuild matches the released asset

```gherkin
Given a release built by CI on the pinned Bun version
When  the same commit is built locally on that version
Then  the two main.js files are byte-identical
```

A mismatch here means something other than the bundler version is floating, since the lockfile already pins the dependencies.

### The transcript still copies after the type change

```gherkin
Given a session with the transcript copy setting on
When  the user presses Copy in the panel header
Then  the clipboard holds the session transcript
And   the panel says Copied
```

The change is a signature rather than behaviour, so a failure here means the callback moved rather than its type.

### The listing goes live

```gherkin
Given the review has no error outstanding
When  the listing is published
Then  Tyto appears in the community plugin directory
And   its entry shows the Donate link
```

The donate link is the check that the release carried the manifest with fundingUrl, rather than one cut before it was added.
