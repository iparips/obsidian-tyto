# Contributing

Voice Edit is an Obsidian plugin built with [Bun](https://bun.sh/) and TypeScript. Bun handles install, test, and bundling, so no separate Node toolchain is needed.

## Prerequisites

- Bun installed
- Obsidian 1.5.0 or newer on desktop
- A [Mistral API key](https://console.mistral.ai/)

## Setup

1. Install Bun
2. Clone this repository
3. Run `bun install` to install dependencies
4. Copy `.env.example` to `.env` and set `OBSIDIAN_VAULT_PATH`
5. Run `./install` to build the plugin and symlink it into that vault

## Install Into a Vault

`.env` holds the target vault, and is gitignored so each machine sets its own:

```bash
cp .env.example .env
```

Set OBSIDIAN_VAULT_PATH to the folder containing your vault's `.obsidian` directory:

```
OBSIDIAN_VAULT_PATH=/Users/you/ObsidianVault/Personal
```

Then run the installer:

```bash
./install
```

It links the repo to `<vault>/.obsidian/plugins/<manifest id>`. The link name must match the `id` in manifest.json (`obsidian-voice-edit`), not the repository name, because Obsidian keys plugin settings and sync off that id. The script reads the id from the manifest, so it stays correct if the id changes.

Re-running it is safe. It refuses to clobber a real directory, so remove a Community Plugins install first:

```bash
rm -rf /path/to/vault/.obsidian/plugins/obsidian-voice-edit
```

It builds first, so an install is never a stale bundle. A failing build aborts the install and leaves the previous one in place. Pass `--skip-tests` to build without the test suite when you want a faster loop.

Those three files, main.js, manifest.json and styles.css, are the plugin.

The link points at the repo itself, so a rebuild is picked up without reinstalling.

## Install For Mobile

Obsidian Sync does not follow symlinks, so a linked install never reaches a phone. The vault gets the plugin's id through `community-plugins.json` but none of its files, which shows on mobile as a plugin that lists but will not enable, with nothing in the console.

Install the built files as a real directory instead:

```bash
./install --copy
```

Sync then carries `main.js`, `manifest.json` and `styles.css` to the phone. Check Settings, Sync on the phone has installed plugins enabled, or the files still will not travel.

A copy is a snapshot, not a link, so run `./install --copy` again whenever the phone needs the current code. Your `data.json`, which holds the API key, is left alone by the copy.

Then in Obsidian: turn off Restricted mode, refresh installed plugins, enable Voice Edit, and paste your Mistral API key into its settings.

## Build and Test

```bash
bun run test        # unit test suite
bun run lint        # eslint
bun run lint:fix    # eslint with autofix
bun run format      # prettier
bun run build       # test, lint, format, then bundle to main.js
```

The build writes main.js at the repo root, next to manifest.json and styles.css. Those three files are the plugin.

After a rebuild, reload the plugin: toggle it off and on in Community plugins, or run "Reload app without saving".

## Code Conventions

- Tests use Vitest, colocated with the code under test
- Prettier and eslint run as part of `bun run build`, so commit formatted code
- Specs live under docs/spec, one folder per feature

Working with an AI agent: see [AGENTS.md](AGENTS.md).

## Releasing

See [RELEASE.md](RELEASE.md).
