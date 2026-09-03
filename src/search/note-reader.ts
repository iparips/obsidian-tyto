import { TAbstractFile, TFile, Vault } from 'obsidian'
import { Attempt, Outcomes } from '../shared/models/outcome'

// Reads a note without touching the session binding, which is what keeps the
// search flow read-only (FR24, FR31).
export class NoteReader {
  constructor(private vault: Vault) {}

  async read(path: string): Promise<Attempt<string>> {
    const file = this.vault.getAbstractFileByPath(path)
    if (!NoteReader.isNote(file)) return Outcomes.failure('apply', `no note at ${path}`)
    return this.readFile(file, path)
  }

  private static isNote(file: TAbstractFile | null): file is TFile {
    return file !== null && 'stat' in file
  }

  private async readFile(file: TFile, path: string): Promise<Attempt<string>> {
    try {
      return Outcomes.success(await this.vault.cachedRead(file))
    } catch {
      return Outcomes.failure('apply', `note at ${path} could not be read`)
    }
  }
}
