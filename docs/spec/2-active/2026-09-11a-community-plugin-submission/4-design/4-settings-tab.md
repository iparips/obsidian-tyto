---
created: 2026-09-11
updated: 2026-09-17
---

# Settings Tab on the Declarative Settings API

The React panel is replaced by `getSettingDefinitions()`, the declarative
settings API Obsidian 1.13 added. Obsidian renders the rows, reads and writes
each value, calls `saveData()`, and indexes the settings for 1.13's settings
search. The plugin describes the settings rather than the DOM.

This is what the scanner checks, through
`settings-tab/prefer-setting-definitions`, so the imperative builder chain is a
rewrite that lands already flagged.

## minAppVersion Moves to 1.13.0

The API needs 1.13.0, and the manifest says 1.5.0. Two ways to satisfy the
rule, and this spec takes the first.

| Path              | Cost                                                          |
| ----------------- | ------------------------------------------------------------- |
| Bump to 1.13.0    | Users below 1.13 cannot install until they update Obsidian    |
| Keep 1.5.0        | `display()` and `getSettingDefinitions()` both, kept in step  |

Decided: bump. The plugin has no installed base to protect, because it has never
been listed, so there is no user on 1.5 to strand. Carrying two renderers to
serve nobody is the worse trade, and the scanner's
`settings-tab/require-display` rule only demands `display()` below 1.13.0.

`minAppVersion` becomes `1.13.0`, and versions.json maps 0.1.0 to it.

## Shape After the Change

Definitions in order, with the settings key each binds to.

```
name / desc               control            key
Mistral API key           render             mistralApiKey
Edit model                text               editModel

group 'Skills'
  Skills folder           folder             skillsPath

group 'Commands'
  Allowed commands        render             commandAllowList
  (the React picker mounts inside the same render callback)

group 'Vault'
  Search the vault        toggle             searchEnabled
  Ask which note          dropdown           openMode
  Copy transcript         toggle             transcriptCopyEnabled
```

A `group` carries the heading, so no setting calls `setHeading()` and none
carries the word "settings". The two general settings sit above the first group,
the rule for a tab with more than one section. Every name is sentence case.

## Two Settings Need a Render Callback

A definition carries either a `control` or a `render` callback, never both. The
callback receives the `Setting` (Obsidian) to fill, and may return a cleanup
function Obsidian calls before tearing the row down. Two settings need one.

The allow list, because it is a live search with a result list that no control
type expresses. Its callback mounts the existing React root and returns the
unmount function. CommandPicker, AllowedEntries and ResolvedCommands (Tyto) are
untouched, and the React tree then owns nothing but the picker.

The API key, because no control masks a value. `SettingTextControl` (Obsidian)
offers `type: 'text'` and a placeholder, and "password" does not appear in the
1.13.1 typings at all, so a declarative control would render the key in clear.
The panel masks it today and must keep doing so.

```ts
{
  name: 'Mistral API key',
  render: (setting) => {
    setting.addText((text) => {
      text.inputEl.type = 'password'
      text.setValue(this.plugin.settings.mistralApiKey)
      text.onChange((value) => this.setControlValue('mistralApiKey', value))
    })
  },
}
```

`inputEl` is public on AbstractTextComponent (Obsidian), and `setControlValue`
is a tab-level hook, so the key persists by the same path as the declarative
controls. Neither callback needs its own `saveData`.

Compliance, recorded because a callback looks like the imperative code the
guidelines push away from, and the next audit will ask.

- `settings-tab/prefer-setting-definitions` checks only that the method exists,
  not what the definitions contain.
- `no-static-styles-assignment` targets `style` and `setAttribute('style', ...)`.
  Setting `inputEl.type` is neither.
- `no-forbidden-elements` forbids `link` and `style` elements, and `addText`
  creates the input through Obsidian anyway.

## What Moves

Each setting keeps its current description text, moved from the settings-note
paragraph into the definition's `desc`. The text is already written for a user
rather than a developer, so it transfers almost as is.

One correction on the way. The allow-list note offers `daily-notes:*` as the
example pattern, which is invalid and matches nothing a user wants, per
[../2-audit/6-the-new-process.md](../2-audit/6-the-new-process.md) finding 19.
The `desc` says `daily-notes` for an id and `open-or-create-file-command:*` for
a pattern, and drops `daily-notes:*` entirely.

Obsidian owns persistence throughout, so the `onChange` plumbing goes: no
`onChange` prop and no `Partial<TytoSettings>` merge. The CSS that styled the
hand-rolled rows goes with SettingsPanel. What styles the picker stays.

## What This Costs

The settings tests are written against the React components. Those covering
SettingsPanel (Tyto) go with it; those covering the three picker components
stay, because those components stay.

This is the one task in the spec that deletes passing tests. Worth saying out
loud so it does not read as a regression: a test asserting Obsidian renders its
own control correctly is not a test worth writing. What replaces them is a unit
test over the returned array, asserting the keys, the order and the groups,
which is the part the plugin still owns.
