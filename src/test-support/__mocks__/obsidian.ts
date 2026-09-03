export interface EditorPosition {
  line: number
  ch: number
}

export interface FileStats {
  mtime: number
}

export interface TAbstractFile {
  path: string
}

export interface TFile extends TAbstractFile {
  basename: string
  stat: FileStats
}

export class Plugin {}

export class ItemView {
  contentEl = document.createElement('div')
  constructor(public leaf: unknown) {}
}

export class PluginSettingTab {
  containerEl = document.createElement('div')
  constructor(
    public app: unknown,
    public plugin: unknown,
  ) {}
}

export class Modal {
  contentEl = document.createElement('div')
  constructor(public app: unknown) {}
  open(): void {}
  close(): void {}
}

export class Notice {
  messageEl = document.createElement('div')
  hidden = false

  constructor(
    public message: string,
    public duration?: number,
  ) {
    NOTICES.push(this)
  }

  hide(): void {
    this.hidden = true
  }
}

// What a test reads back, since Obsidian's own notices have no other handle.
export const NOTICES: Notice[] = []

export class Setting {
  constructor(public containerEl: HTMLElement) {}
  addButton(): this {
    return this
  }
}

export class MarkdownView {
  file: TFile | null = null
  editor!: Editor
}

export type Editor = {
  getValue(): string
  replaceRange(text: string, from: EditorPosition, to: EditorPosition): void
  getCursor(): EditorPosition
  setCursor(pos: EditorPosition): void
  scrollIntoView(range: { from: EditorPosition; to: EditorPosition }, center?: boolean): void
}

export interface ListedFiles {
  files: string[]
  folders: string[]
}

export interface DataAdapter {
  list(normalizedPath: string): Promise<ListedFiles>
  read(normalizedPath: string): Promise<string>
}

export type App = Record<string, unknown>
export type WorkspaceLeaf = Record<string, unknown>

export interface Command {
  id: string
  name: string
  checkCallback?(checking: boolean): boolean | void
}

export interface Workspace {
  getActiveFile(): TFile | null
  getLeavesOfType(type: string): unknown[]
}

export interface Vault {
  getMarkdownFiles(): TFile[]
  cachedRead(file: TFile): Promise<string>
  getAbstractFileByPath(path: string): TAbstractFile | null
}
