import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

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

// Create git tag for the new version
try {
  execSync(`git add package.json manifest.json versions.json`)
  execSync(`git commit -m "Bump version to ${newVersion}"`)
  execSync(`git tag ${newVersion}`)
  console.log(`✅ Version bumped to ${newVersion}`)
  console.log(`✅ Git tag ${newVersion} created`)
  console.log(`📝 To push: git push origin main --tags`)
  console.log(`🚀 To release: Create a release on GitHub using tag ${newVersion}`)
} catch (error) {
  console.error('❌ Git operations failed:', error.message)
  console.log(`📝 Files updated to version ${newVersion}, but git tag creation failed`)
}
