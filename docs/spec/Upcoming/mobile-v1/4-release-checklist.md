# Mobile V1: Release Checklist

1. manifest.json final: id, minAppVersion, isDesktopOnly false, fundingUrl if wanted.
2. README: feature overview, setup per provider, and the privacy posture stated plainly - audio and note content go only to the selected provider with the user's own key; both providers have no-training-by-default API policies (NFR1).
3. versions.json and version-bump script wired.
4. Both exit tests green: Mobile MVP matrix and Mobile V1 matrix.
5. Community plugin submission PR to obsidianmd/obsidian-releases, following the plugin review guidelines (no innerHTML, async onload, no global styles leakage).
6. Tag the release with main.js, manifest.json, styles.css attached.
