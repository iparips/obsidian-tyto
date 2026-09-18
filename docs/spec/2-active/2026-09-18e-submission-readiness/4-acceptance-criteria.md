---
created: 2026-09-18
updated: 2026-09-18
---

# Acceptance Criteria

## Setup

- A vault with at least one markdown note, and a configured Mistral API key
- The plugin installed from a build of the current tree
- The developer console open at its default level, showing no filter

### A full turn prints nothing to the console

```gherkin
Given a session bound to a note, with the panel hidden
When  the user speaks an instruction that edits the note
Then  the console shows no output from the plugin
And   the note carries the edit
```

The panel hidden is the point: the deferred-leaf path that holds the two debug calls runs when no visible leaf shows the note.

### The repo page names the plugin and its licence

```gherkin
Given the repository page on GitHub
When  a reviewer opens it
Then  the description names what the plugin does
And   the sidebar shows AGPL-3.0 rather than Other
And   the topics include obsidian-plugin
```

If the licence still reads Other after the change, that is D1 unresolved rather than a failed step. It does not block the submission.

### A release carries three attested assets

```gherkin
Given a release drafted on a tag matching the manifest version
When  the build workflow finishes
Then  the release holds main.js, manifest.json and styles.css
And   `gh attestation verify main.js` passes against the repository
```

A missing asset usually means the workflow's release steps did not run, which happens when the release was published rather than created.

### The directory's scan rebuilds the shipped bundle

```gherkin
Given the submission entered at community.obsidian.md
When  the scan result arrives in the dashboard
Then  it reports no blocker
And   its rebuild of main.js matches the released one
```

A rebuild mismatch means the release was cut from a tree other than the tagged commit. The fix is a fresh release, not a change to the build script.
