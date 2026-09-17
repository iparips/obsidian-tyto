---
created: 2026-09-11
updated: 2026-09-11
---

# Review Comments

These do not block the listing. A reviewer raises them, and each costs a round
trip if it is left.

## 5. The settings tab bypasses the Setting API

Owl renders its own React inputs into the settings container. The result is
styled by Owl's CSS rather than Obsidian's, so it looks foreign next to every
other plugin, and it sidesteps `setHeading()`.

- Rule: "Use `setHeading` instead of a `<h1>`, `<h2>`" and the UI-text section
  generally. (Plugin guidelines, UI text)
- Evidence: src/settings/settings-tab.tsx mounts a React root on
  `containerEl`; src/settings/SettingsPanel.tsx builds labels and inputs by
  hand.
- Note: the plugin uses no HTML heading, so it does not break the letter of the
  heading rule. It breaks the intent, which is that settings look and behave
  the same across every plugin.

## 6. Debug logging ships enabled

Eight `console.debug` calls run in normal use, including one per model
iteration. The console should carry errors only.

- Rule: "In its default configuration, the developer console should only show
  error messages, debug messages should not be shown." (Plugin guidelines,
  General)
- Evidence: src/capture/recorder.ts lines 48 and 66;
  src/skills/skill-repository.ts lines 32 and 35;
  src/engine/turn/model-service.ts line 74; src/session/session-progress.ts
  line 62; src/session/session-file-store.ts lines 34 and 61.

## 7. Vault reads go through the adapter

Three collaborators read vault files with `vault.adapter` rather than the Vault
API, losing the cache and the serialised writes the guidelines cite.

- Rule: "The Vault API has two main advantages over the Adapter API:
  performance and safety." (Plugin guidelines, Vault)
- Evidence: SkillRepository and AgentsMdRepository take an adapter (src/main.ts
  lines 184 and 188); AgentsMdRepository reads with `adapter.read`
  (src/agents/agents-md-repository.ts line 55).
- Caveat: SessionFileStore writes into `this.manifest.dir`, the plugin's own config
  folder, which the Vault API does not address. That one must stay on the
  adapter and is the accepted use of it.

## 8. Constructed paths are not normalised

Skill and AGENTS.md paths are built from a user-typed settings value joined to
folder names. `normalizePath()` is never called.

- Rule: "Use `normalizePath()` on user-defined paths and paths you construct."
  (Plugin guidelines, Vault)
- Evidence: no occurrence of `normalizePath` in src.

## 9. Defaults reach into the vault before the user asks

A fresh install allows the `daily-notes:*` command namespace and turns vault
search on. Both are reasonable once a user has opted in. As defaults they mean
the plugin can run a command and read notes across the vault on first launch.

- Rule: not a written rule. It is the posture the policies describe, which
  prioritises "private and offline usage of the app", and it is what a reviewer
  reads the defaults against.
- Evidence: DEFAULT_SETTINGS, src/settings/settings.ts.

## 10. The description already passes

The manifest description is 99 characters, ends with a period, and carries no
emoji. The guidance prefers an opening action statement, and "Edit your notes
by voice." already is one. No change needed; recorded so the check is not
repeated.
