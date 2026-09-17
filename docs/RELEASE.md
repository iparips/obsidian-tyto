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

## 5. Draft the Release

Go to Releases, then "Draft a new release". Select the new tag, title it
`v0.2.0`, and write what changed. Publish.

Creating it triggers .github/workflows/build.yml, which rebuilds from a clean
checkout and attaches main.js, manifest.json and styles.css, attested with
GitHub's build provenance. Nothing is uploaded by hand.

```bash
gh release create 0.2.0 --title "v0.2.0" --generate-notes
```

The run fails if manifest.json disagrees with the tag, since a release the
directory cannot resolve is worse than no release.

## 6. Check the Assets Landed

```bash
gh attestation verify main.js --repo <owner>/<repo>
```

Three assets on the release, each attested.

## Version History

See GitHub Releases for the full changelog.
