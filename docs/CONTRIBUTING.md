# Contributing

Tyto is an Obsidian plugin built with [Bun](https://bun.sh/) and TypeScript. Bun handles install, test, and bundling, so no separate Node toolchain is needed.

## Prerequisites

- Bun 1.3.13, the version .github/workflows/build.yml pins. Another version builds and tests fine, but produces a different main.js, and a release is reproducible only against the pinned one.
- Obsidian 1.13.0 or newer on desktop, which is the manifest's minAppVersion
- A [Mistral API key](https://console.mistral.ai/)

## Setup

1. Install Bun
2. Clone this repository
3. Run `bun install` to install dependencies
4. Copy `.env.example` to `.env` and set `OBSIDIAN_VAULT_PATH`
5. Run `./install` to build the plugin and copy it into that vault

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

It copies `main.js`, `manifest.json` and `styles.css` into `<vault>/.obsidian/plugins/<manifest id>`. Those three files are the plugin. The directory name must match the `id` in manifest.json (`tyto`), not the repository name, because Obsidian keys plugin settings and sync off that id. The script reads the id from the manifest, so it stays correct if the id changes.

Re-running it is safe. Your `data.json`, which holds the API key, is left where it is.

It builds first, so an install is never a stale bundle. A failing build aborts the install and leaves the previous one in place. Pass `--skip-tests` to build without the test suite when you want a faster loop.

Copying is the default because Obsidian Sync does not follow symlinks, so a linked install never reaches a phone. The vault gets the plugin's id through `community-plugins.json` but none of its files, which shows on mobile as a plugin that lists but will not enable, with nothing in the console. Check Settings, Sync on the phone has installed plugins enabled, or the files still will not travel.

A copy is a snapshot, not a link, so run `./install` again whenever the vault needs the current code.

## Install For Desktop Development

To skip that reinstall on every rebuild, link the repo instead:

```bash
./install --link
```

The link points at the repo itself, so a rebuild is picked up without reinstalling. It never reaches mobile.

Linking refuses to clobber a real directory, so remove a copied or Community Plugins install first:

```bash
rm -rf /path/to/vault/.obsidian/plugins/tyto
```

Then in Obsidian: turn off Restricted mode, refresh installed plugins, enable Tyto, and paste your Mistral API key into its settings.

## Build and Test

```bash
bun run test        # unit test suite
bun run lint        # eslint
bun run lint:fix    # eslint with autofix
bun run format      # prettier
bun run verify      # typecheck, test, lint, format, then bundle for development
bun run build       # the release bundle: minified, React in production mode
bun run build:dev   # the same bundle unminified, which is what verify runs
```

The build writes main.js at the repo root, next to manifest.json and styles.css. Those three files are the plugin.

`build` is the bundle alone because the community directory's scan calls it to rebuild from source and compare the result against the released main.js. `verify` is the one to run by hand.

Two bundles, because the one worth shipping is the one worth debugging least. `build` minifies and builds React in production mode, which is a third of the size and is what CI, a release and the directory's scan all produce. `build:dev` skips both, so a stack trace from an installed development build still names its functions, and `./install` uses it for the same reason.

After a rebuild, reload the plugin: toggle it off and on in Community plugins, or run "Reload app without saving".

## Code Conventions

- Tests use Vitest, in a tests/ folder beside the code under test
- Prettier and eslint run as part of `bun run verify`, so commit formatted code
- Specs live under docs/spec, one folder per feature

Working with an AI agent: see [AGENTS.md](../AGENTS.md).

## Releasing

See [RELEASE.md](RELEASE.md).
