# Release Process

Always release from `main`, after merging the feature PR. Tags must point at commits on main, not feature branches.

## 1. Merge and Checkout Main

```bash
git checkout main && git pull
```

## 2. Verify and Build

```bash
bun run verify
```

This typechecks, runs the suite, lints, formats, then bundles main.js.

`bun run build` is the bundle alone. The community directory's scan calls it to
rebuild from source and compare against the released main.js, so it must stay
the bundle and nothing else.

## 3. Bump the Version

Pick the command matching the change:

```bash
bun run version:patch   # bug fixes (0.1.0 -> 0.1.1)
bun run version:minor   # new features (0.1.0 -> 0.2.0)
bun run version:major   # breaking changes (0.1.0 -> 1.0.0)
```

This updates package.json, manifest.json, and versions.json, then commits and tags.

## 4. Push to GitHub

```bash
git push origin main --tags
```

## 5. Create the GitHub Release

1. Go to Releases, then "Draft a new release"
2. Select the new tag, for example `0.2.0`
3. Set the title to `v0.2.0`
4. Fill in new features, bug fixes, and the minimum Obsidian version from manifest.json
5. Upload main.js, manifest.json, and styles.css as release assets
6. Publish

### Using GitHub CLI

```bash
gh release create 0.2.0 main.js manifest.json styles.css \
  --title "v0.2.0" \
  --notes "## What's New
- Feature X
- Bug fix Y"
```

## Version History

See GitHub Releases for the full changelog.
