# C. Make It Safe For A Stranger

Everything here exists because someone who is not the author will install this.
A stranger has no API key, no allow-list, and no patience for an edit landing
in the wrong note.

C1 to C4 are the remaining commits of
[community-plugin-submission/5-tasks.md](../spec/1-upcoming/2026-09-11a-community-plugin-submission/5-tasks.md).
Its commit 1, the rename from Owl to Tyto, is done: the manifest id is tyto and
no Owl string survives in src or styles.css.

### C1. Migrate settings across the id change (2 h)

The blocker's real cost, and the only task that touches a user's stored data.

- [ ] LegacySettingsMigration, reading the legacy path and writing through saveData
- [ ] Call it from onload, in place of the loadData spread
- [ ] Teach the installer to remove a stale obsidian-owl folder
- [ ] Exit test: install over an Owl-era config, then into a clean vault

### C2. Disclose network use, and silence the console (2 h)

- [ ] README disclosure: the service, what is sent, when, why, and what never leaves
- [ ] Remove the eight console.debug calls, keeping their catch blocks
- [ ] Exit test: a full turn prints nothing at default log level

### C3. Rebuild the settings tab (3 h)

The task a reviewer is most likely to comment on.

- [ ] Setting builders in TytoSettingsTab, replacing SettingsPanel
- [ ] Three headings: Skills, Commands, Vault
- [ ] Keep the React command picker, mounted under Commands
- [ ] Exit test: it looks native beside a core plugin, and the picker still works

### C4. Vault reads and release defaults (2 h)

- [ ] AgentsMdRepository and SkillRepository take Vault rather than DataAdapter
- [ ] DEFAULT_SETTINGS ships an empty allow list and search off
- [ ] A build:release script without sourcemaps
- [ ] Exit test: a fresh vault runs no command until the boxes are ticked

### C5. First-run onboarding when no API key is set (3 h)

- [ ] Say what is missing and where to put it
- [ ] Leave no surface stuck pending without a key

### C6. Harden every error path (3 h)

Each produces a panel entry naming the failing step, and none leaves the panel
stuck pending (NFR5).

- [ ] A bad key
- [ ] A network drop
- [ ] A rate limit
- [ ] A malformed tool call

### C7. Audit against the plugin review guidelines (2 h)

Covered by step 2 of
[mobile-v1/4-release-checklist.md](../spec/1-upcoming/2026-09-14c-mobile-v1/4-release-checklist.md).

- [ ] No innerHTML
- [ ] Async onload
- [ ] No global style leakage
- [ ] A detach that cleans up every listener

### C8. Demo clip and screenshots, both surfaces (2 h)

- [ ] Desktop clip
- [ ] Mobile clip
- [ ] Screenshots for the listing

## Submission

Submit at the end of C. The loop works, it works on a phone, it survives being
backgrounded, it fails legibly, and it says where the audio goes. That is
enough.

- [ ] Rotate the Mistral key sitting in the working tree's data.json
- [ ] Tag 1.0.0 with one provider and no streaming
- [ ] Cut a release with main.js, manifest.json and styles.css attached
- [ ] Submit to the community store

A second provider doubles the surface to keep working while learning what real
users break, which is why it waits for milestone D. Review takes weeks and is
outside your control, so D is what to build during it.

## The Eval Suite

Not scheduled, and worth reaching for the moment a prompt change breaks
something twice.
[eval-suite/1-index.md](../spec/1-upcoming/2026-09-11b-eval-suite/1-index.md)
is designed in five commits, the first of which is CI for the unit suite the
repo does not yet have.

Its case for existing gets stronger after the listing, when a prompt change
reaches strangers rather than only the author.
