import { DataAdapter, ListedFiles } from 'obsidian'

// Mirrors the adapter contract SkillLoader relies on: list() throws on a
// missing directory, read() throws on a missing file.
export class FakeAdapter {
  readonly listed: string[] = []

  constructor(private files: Record<string, string> = {}) {}

  asAdapter(): DataAdapter {
    return this as unknown as DataAdapter
  }

  withSkill(folder: string, source: string): this {
    this.files[`${folder}/SKILL.md`] = source
    return this
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
    const source = this.files[path]
    if (source === undefined) throw new Error(`ENOENT: ${path}`)
    return source
  }
}
