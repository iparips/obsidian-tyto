import { normalizePath, TFolder, Vault } from 'obsidian'
import { Skill } from './skill'
import { SkillFrontmatterParser } from './skill-frontmatter'

const SKILL_FILE = 'SKILL.md'

// Every absent-or-broken case is an empty result rather than a failure, so a
// vault without skills behaves exactly as one built before them (FR38).
export class SkillRepository {
  constructor(
    private vault: Vault,
    private skillsPath: string,
  ) {}

  // Descriptions only: prompt cost scales with skill count, not skill size (NFR6).
  async listSkills(): Promise<readonly Skill[]> {
    if (!this.skillsPath.trim()) return []
    const skills = await Promise.all(this.skillFolders().map((folder) => this.read(folder)))
    return skills.filter((skill): skill is Skill => skill !== null)
  }

  // Bodies are read on demand, for the one skill an utterance matched, so the
  // per-turn prompt cost stays tied to that skill rather than the whole vault.
  async readBody(skill: Skill): Promise<string | null> {
    return this.readFile(skill.path)
  }

  private skillFolders(): string[] {
    const root = this.vault.getFolderByPath(normalizePath(this.skillsPath))
    if (!root) return []
    return root.children
      .filter((child): child is TFolder => child instanceof TFolder)
      .map((folder) => folder.path)
  }

  private async read(folder: string): Promise<Skill | null> {
    const path = `${folder}/${SKILL_FILE}`
    const source = await this.readFile(path)
    if (source === null) return null
    const frontmatter = SkillFrontmatterParser.parse(source)
    if (!frontmatter) return null
    return new Skill(frontmatter.name, frontmatter.description, path)
  }

  // cachedRead rather than read: a skill is read for its content and never
  // written back, which is the case the cache exists for.
  private async readFile(path: string): Promise<string | null> {
    const file = this.vault.getFileByPath(normalizePath(path))
    if (!file) return null
    try {
      return await this.vault.cachedRead(file)
    } catch {
      return null
    }
  }
}
