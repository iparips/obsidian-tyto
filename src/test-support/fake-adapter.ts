import { DataAdapter, ListedFiles } from 'obsidian'

// Mirrors the adapter contract SkillRepository relies on: list() throws on a
// missing directory, read() throws on a missing file. remove() throws on a
// missing file too, which is what SessionStore swallows.
export class FakeAdapter {
  readonly listed: string[] = []
  readonly reads: string[] = []
  readonly removed: string[] = []
  private readonly vanishing = new Set<string>()
  private unwritable = false

  constructor(private files: Record<string, string> = {}) {}

  asAdapter(): DataAdapter {
    return this as unknown as DataAdapter
  }

  withSkill(folder: string, source: string): this {
    this.files[`${folder}/SKILL.md`] = source
    return this
  }

  // Readable once, then gone: the skill lists from its frontmatter and the
  // later body read fails, as when the file is deleted mid-turn.
  withSkillDeletedAfterListing(folder: string, source: string): this {
    this.files[`${folder}/SKILL.md`] = source
    this.vanishing.add(`${folder}/SKILL.md`)
    return this
  }

  withFile(path: string, source: string): this {
    this.files[path] = source
    return this
  }

  // Every write fails, as a full disk or a read-only vault does.
  withFailingWrites(): this {
    this.unwritable = true
    return this
  }

  contentsOf(path: string): string | undefined {
    return this.files[path]
  }

  async list(path: string): Promise<ListedFiles> {
    this.listed.push(path)
    const folders = Object.keys(this.files)
      .filter((file) => file.startsWith(`${path}/`))
      .map((file) => file.slice(0, file.lastIndexOf('/')))
    if (folders.length === 0) throw new Error(`ENOENT: ${path}`)
    return { files: [], folders: [...new Set(folders)] }
  }

  async read(path: string): Promise<string> {
    this.reads.push(path)
    const source = this.files[path]
    if (source === undefined) throw new Error(`ENOENT: ${path}`)
    if (this.vanishing.has(path)) delete this.files[path]
    return source
  }

  async write(path: string, source: string): Promise<void> {
    if (this.unwritable) throw new Error(`EACCES: ${path}`)
    this.files[path] = source
  }

  async remove(path: string): Promise<void> {
    if (this.files[path] === undefined) throw new Error(`ENOENT: ${path}`)
    this.removed.push(path)
    delete this.files[path]
  }
}
