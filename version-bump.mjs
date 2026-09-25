import { readFileSync, writeFileSync } from 'fs'
import { execFileSync, execSync } from 'child_process'

// Get bump type from command line argument
const bumpType = process.argv[2]?.toLowerCase()
if (!bumpType || !['major', 'minor', 'patch'].includes(bumpType)) {
  console.error('Please specify version bump type: major, minor, or patch')
  process.exit(1)
}

// Read current version from package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const [major, minor, patch] = packageJson.version.split('.').map(Number)

// Calculate new version based on bump type
let newVersion
switch (bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`
    break
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`
    break
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`
    break
}

// Update package.json with new version
packageJson.version = newVersion
writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n')

// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync('manifest.json', 'utf8'))
const { minAppVersion } = manifest
manifest.version = newVersion
writeFileSync('manifest.json', JSON.stringify(manifest, null, 2) + '\n')

// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync('versions.json', 'utf8'))
versions[newVersion] = minAppVersion
writeFileSync('versions.json', JSON.stringify(versions, null, 2) + '\n')

// The tag the notes are written against: the newest one a release was actually
// cut from, not the previous tag. A tag bumped but never released ships to the
// user with the next release, so its changes belong in these notes.
function lastReleasedTag() {
  try {
    const released = execSync('gh release list --json tagName --limit 100', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const tags = JSON.parse(released)
      .map((release) => release.tagName)
      .filter((tag) => tag !== newVersion)
    if (tags.length > 0) return tags[0]
  } catch {
    // gh missing, unauthenticated, or no remote: fall back to the previous tag.
  }
  return previousTag()
}

function previousTag() {
  const tags = execSync('git tag --sort=-v:refname', { encoding: 'utf8' })
    .split('\n')
    .filter((tag) => tag.trim() !== '' && tag.trim() !== newVersion)
  return tags.length > 0 ? tags[0].trim() : null
}

// Written after the tag exists, so the notes file is its own commit rather than
// part of the bump. The bump is what the tag points at, and a release's notes
// are not something the release has to contain.
function writeReleaseNotes(since) {
  const range = since ? `${since}..HEAD` : 'the first commit'
  const notesPath = `docs/release-notes/${newVersion}.md`
  const prompt = [
    `Write the release notes for Tyto ${newVersion} to ${notesPath}, creating the directory if it does not exist.`,
    ``,
    `Cover every change in ${range}. That range starts at the last tag a release was actually cut from, so it may span several version bumps; a user upgrading receives all of it at once.`,
    ``,
    `Read the commit bodies with: git log ${range} --format='%H%n%s%n%b'`,
    ``,
    `Shape:`,
    `- Start with "# ${newVersion}". Where the range spans more than one version bump, add one line under it saying so.`,
    `- Group under "## Fixed", "## Changed" and "## Added", in that order, leaving out any that would be empty.`,
    `- One bullet per user-visible change, written for someone who uses Tyto and has not read the code. Say what is different for them, and where a fix matters, what went wrong before.`,
    `- Put the changes that most affect a user first, especially anything that could have lost their work.`,
    `- Leave out what a user cannot see: version bumps, spec and doc folders, test-only changes, internal refactors. Collapse a run of commits on one theme into a single bullet.`,
    `- Australian English. No trailing full stop on a bullet that is a fragment, and no emoji.`,
  ].join('\n')

  // An interactive session rather than --print, so the notes can be read and
  // argued with before they are committed. The prompt is the session's first
  // instruction, passed as an argument: piping it to stdin would open a session
  // that never receives it.
  console.log(`📝 Opening a Claude session to write the notes for ${range} ...`)
  execFileSync('claude', [prompt], { stdio: 'inherit' })
  console.log(`✅ Session closed. Notes should be at ${notesPath}`)
  console.log(`📝 Review them, then commit: git add ${notesPath} && git commit`)
}

// Create git tag for the new version
try {
  const since = lastReleasedTag()
  execSync(`git add package.json manifest.json versions.json`)
  execSync(`git commit -m "Bump version to ${newVersion}"`)
  execSync(`git tag ${newVersion}`)
  console.log(`✅ Version bumped to ${newVersion}`)
  console.log(`✅ Git tag ${newVersion} created`)
  try {
    writeReleaseNotes(since)
  } catch (error) {
    // The bump and the tag stand: notes are written after them and are not
    // what a release needs to exist.
    console.error('❌ Release notes failed:', error.message)
    console.log(`📝 Write them by hand into docs/release-notes/${newVersion}.md`)
  }
  console.log(`📝 To push: git push origin main --tags`)
  console.log(`🚀 To release: Create a release on GitHub using tag ${newVersion}`)
} catch (error) {
  console.error('❌ Git operations failed:', error.message)
  console.log(`📝 Files updated to version ${newVersion}, but git tag creation failed`)
}
