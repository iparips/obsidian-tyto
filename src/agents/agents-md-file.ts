// The empty string is the vault root, so a root file labels as the vault itself.
const ROOT_LABEL = 'vault root'

export class AgentsMdFile {
  constructor(
    readonly folder: string,
    readonly fileName: string,
    readonly contents: string,
  ) {}

  label(): string {
    return this.folder === '' ? ROOT_LABEL : this.folder
  }

  size(): number {
    return this.contents.length
  }
}
