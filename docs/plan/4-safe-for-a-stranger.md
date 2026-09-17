# C. Make It Safe For A Stranger

Everything here exists because someone who is not the author will install this.
A stranger has no API key, no allow-list, and no patience for an edit landing
in the wrong note.

C1 to C4 shipped in pull request 7, and their spec is archived at
[community-plugin-submission/5-tasks.md](../spec/3-archived/2026-09-11b-community-plugin-submission/5-tasks.md).
C5 onwards are still open.

### C1. Migrate settings across the id change (done)

The blocker's real cost, and the only task that touches a user's stored data.

- [x] LegacySettingsMigration, reading the legacy path and writing through saveData
- [x] Call it from onload, in place of the loadData spread
- [x] Teach the installer to remove a stale obsidian-owl folder, once the new id
      holds a data.json of its own
- [x] Exit test: install over an Owl-era config, then into a clean vault

### C2. Disclose network use, and silence the console (done)

- [x] README disclosure: the service, what is sent, when, why, and what never leaves
- [x] Remove the eight console.debug calls, keeping their catch blocks
- [x] Exit test: a full turn prints nothing at default log level

### C3. Rebuild the settings tab (done)

The task a reviewer is most likely to comment on.

- [x] getSettingDefinitions in TytoSettingsTab, replacing SettingsPanel. The
      declarative API rather than the builder chain, which is what the scanner
      asks for
- [x] Three groups: Skills, Commands, Vault
- [x] Keep the React command picker, mounted under Commands
- [ ] Exit test: it looks native beside a core plugin, and the picker still
      works. Still to run by hand against a real vault

### C4. Vault reads and release defaults (done)

- [x] AgentsMdRepository and SkillRepository take Vault rather than DataAdapter
- [x] DEFAULT_SETTINGS ships search off, and the allow list holding daily-notes,
      which destroys nothing and so is safe to allow unasked
- [x] `build` is the bundle alone, without sourcemaps. No build:release script:
      the scanner calls the first script named build, so that is where the
      release settings have to live
- [x] Exit test: a fresh vault searches nothing, and reaches no command beyond
      the daily note

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
[eval-suite/1-index.md](../spec/1-upcoming/2026-09-11c-eval-suite/1-index.md)
is designed in five commits, the first of which is CI for the unit suite the
repo does not yet have.

Its case for existing gets stronger after the listing, when a prompt change
reaches strangers rather than only the author.
