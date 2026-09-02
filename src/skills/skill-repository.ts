import { DataAdapter } from 'obsidian'
import { Skill } from './skill'
import { SkillFrontmatterParser } from './skill-frontmatter'

const SKILL_FILE = 'SKILL.md'

// Every absent-or-broken case is an empty result rather than a failure, so a
// vault without skills behaves exactly as one built before them (FR38).
export class SkillRepository {
  constructor(
    private adapter: DataAdapter,
    private skillsPath: string,
  ) {}

  // Descriptions only: prompt cost scales with skill count, not skill size (NFR6).
  async listSkills(): Promise<readonly Skill[]> {
    if (!this.skillsPath.trim()) return []
    const folders = await this.skillFolders()
    const skills = await Promise.all(folders.map((folder) => this.read(folder)))
    return skills.filter((skill): skill is Skill => skill !== null)
  }

  // Bodies are read on demand, for the one skill an utterance matched, so the
  // per-turn prompt cost stays tied to that skill rather than the whole vault.
  async readBody(skill: Skill): Promise<string | null> {
    return this.readFile(skill.path)
  }

  private async skillFolders(): Promise<string[]> {
    try {
      const folders = (await this.adapter.list(this.skillsPath)).folders
      console.debug('[owl]', folders.length, 'skill folders under', this.skillsPath)
      return folders
    } catch {
      console.debug('[owl] no skill folders under', this.skillsPath)
      return []
    }
  }

  private async read(folder: string): Promise<Skill | null> {
    const path = `${folder}/${SKILL_FILE}`
    const source = await this.readFile(path)
    if (source === null) return null
    const frontmatter = SkillFrontmatterParser.parse(source)
    if (!frontmatter) return null
    return new Skill(frontmatter.name, frontmatter.description, path)
  }

  private async readFile(path: string): Promise<string | null> {
    try {
      return await this.adapter.read(path)
    } catch {
      return null
    }
  }
}
