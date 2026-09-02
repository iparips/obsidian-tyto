import { TFile, Vault } from 'obsidian'

interface FakeNote {
  content: string
  mtime: number
}

// Backs the search tests: notes keyed by path, each with a modification time a
// test can set, which is what makes the recency filter assertable.
export class FakeVault {
  readonly reads: string[] = []
  private readonly notes = new Map<string, FakeNote>()

  asVault(): Vault {
    return this as unknown as Vault
  }

  withNote(path: string, content: string, mtime = Date.now()): this {
    this.notes.set(path, { content, mtime })
    return this
  }

  getMarkdownFiles(): TFile[] {
    return [...this.notes.entries()].map(([path, note]) => FakeVault.fileOf(path, note))
  }

  async cachedRead(file: TFile): Promise<string> {
    this.reads.push(file.path)
    return this.notes.get(file.path)?.content ?? ''
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
