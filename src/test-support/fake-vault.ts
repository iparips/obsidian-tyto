import { TFile, TFolder, Vault } from 'obsidian'
import { FakeNoteLocator } from './fake-note-locator'

interface FakeNote {
  content: string
  mtime: number
}

// Backs the search tests: notes keyed by path, each with a modification time a
// test can set, which is what makes the recency filter assertable.
export class FakeVault {
  readonly reads: string[] = []
  private readonly notes = new Map<string, FakeNote>()
  private readonly vanishing = new Set<string>()

  asVault(): Vault {
    return this as unknown as Vault
  }

  withNote(path: string, content: string, mtime = Date.now()): this {
    this.notes.set(path, { content, mtime })
    return this
  }

  // A skill is a folder holding a SKILL.md, so naming the folder is what a test
  // varies and the file name is the convention it does not.
  withSkill(folder: string, source: string): this {
    return this.withNote(`${folder}/SKILL.md`, source)
  }

  // Readable once, then gone: the skill lists from its frontmatter and the
  // later body read fails, as when the file is deleted mid-turn.
  withSkillDeletedAfterListing(folder: string, source: string): this {
    const path = `${folder}/SKILL.md`
    this.vanishing.add(path)
    return this.withNote(path, source)
  }

  // A view that finished loading holds the file's text, which is what the
  // writer's trust test compares. Notes the test set itself are left alone, so
  // a disagreement it asked for survives. The save is wired the same way round,
  // since a flushed view writes its text to this vault.
  withLoadedNotes(locator: FakeNoteLocator): this {
    locator.openNotes().forEach((editor, path) => {
      if (!this.notes.has(path)) this.withNote(path, editor.getValue())
    })
    locator.savesWith((path, content) => this.withNote(path, content))
    return this
  }

  getMarkdownFiles(): TFile[] {
    return [...this.notes.entries()].map(([path, note]) => FakeVault.fileOf(path, note))
  }

  async cachedRead(file: TFile): Promise<string> {
    this.reads.push(file.path)
    const content = this.notes.get(file.path)?.content ?? ''
    if (this.vanishing.has(file.path)) this.notes.delete(file.path)
    return content
  }

  getFileByPath(path: string): TFile | null {
    const note = this.notes.get(path)
    return note ? FakeVault.fileOf(path, note) : null
  }

  // Every folder a note's path implies, since a test states its notes rather
  // than the tree above them. Children are the folders directly beneath it.
  getFolderByPath(path: string): TFolder | null {
    const folders = this.folderPaths()
    if (!folders.has(path)) return null
    const children = [...folders]
      .filter((folder) => FakeVault.parentOf(folder) === path)
      .map((folder) => FakeVault.folderOf(folder))
    return FakeVault.folderOf(path, children)
  }

  // Shaped rather than constructed: the real TFolder takes no arguments, and
  // SkillRepository narrows on the prototype the mock's class supplies.
  private static folderOf(path: string, children: TFolder[] = []): TFolder {
    return Object.assign(Object.create(TFolder.prototype) as TFolder, { path, children })
  }

  private folderPaths(): Set<string> {
    const folders = new Set<string>()
    this.notes.forEach((_note, path) => {
      for (let folder = FakeVault.parentOf(path); folder; folder = FakeVault.parentOf(folder))
        folders.add(folder)
    })
    return folders
  }

  private static parentOf(path: string): string {
    const cut = path.lastIndexOf('/')
    return cut === -1 ? '' : path.slice(0, cut)
  }

  // The real one reads, modifies and saves atomically, which a test observes
  // only as the callback seeing what the note holds now.
  async process(file: TFile, fn: (data: string) => string): Promise<string> {
    const note = this.notes.get(file.path)
    if (!note) return ''
    const content = fn(note.content)
    this.notes.set(file.path, { ...note, content })
    return content
  }

  contentOf(path: string): string {
    return this.notes.get(path)?.content ?? ''
  }

  getAbstractFileByPath(path: string): TFile | null {
    const note = this.notes.get(path)
    return note ? FakeVault.fileOf(path, note) : null
  }

  private static fileOf(path: string, note: FakeNote): TFile {
    return {
      path,
      basename: path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, ''),
      stat: { mtime: note.mtime },
    } as TFile
  }
}
