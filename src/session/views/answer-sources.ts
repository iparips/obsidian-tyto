// Twelve archived notes share one long folder, so a flat list of paths is
// mostly that folder repeated twelve times and the filenames are what the user
// is reading for. Grouped by folder, the folder is said once.
// The name is what the user reads and the path is what opening one needs, so a
// source carries both rather than the view re-deriving either.
export interface SourceNote {
  readonly name: string
  readonly path: string
}

export interface SourceGroup {
  readonly folder: string
  readonly notes: readonly SourceNote[]
}

export class AnswerSources {
  // Insertion-ordered, so the groups come back in the order the answer cited
  // them rather than sorted into an order the answer did not use.
  static grouped(sources: readonly string[]): SourceGroup[] {
    const byFolder = new Map<string, SourceNote[]>()
    for (const path of sources) {
      const folder = AnswerSources.folderOf(path)
      const notes = byFolder.get(folder) ?? []
      notes.push({ name: AnswerSources.nameOf(path), path })
      byFolder.set(folder, notes)
    }
    return [...byFolder].map(([folder, notes]) => ({ folder, notes }))
  }

  // The vault root reads as its own name rather than as an empty label, since a
  // note there has a folder in the same sense the others do.
  private static folderOf(path: string): string {
    const cut = path.lastIndexOf('/')
    return cut === -1 ? 'the vault root' : path.slice(0, cut)
  }

  // The extension goes: every source is a note, so ".md" on each of twelve
  // lines says nothing the user did not already know.
  private static nameOf(path: string): string {
    const name = path.slice(path.lastIndexOf('/') + 1)
    return name.endsWith('.md') ? name.slice(0, -3) : name
  }
}
