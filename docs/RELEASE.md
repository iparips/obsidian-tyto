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

## 5. Let the Workflow Cut the Release

Pushing the tag triggers .github/workflows/release.yml, which rebuilds from a
clean checkout, attaches main.js, manifest.json and styles.css, and attests
them with GitHub's build provenance. Nothing is uploaded by hand.

It fails the run if manifest.json disagrees with the tag, since a release the
directory cannot resolve is worse than no release.

Check the attestations landed:

```bash
gh attestation verify main.js --repo <owner>/<repo>
```

Then edit the generated notes if they need more than the commit list.

## Version History

See GitHub Releases for the full changelog.
