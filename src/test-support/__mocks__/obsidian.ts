export interface EditorPosition {
  line: number
  ch: number
}

export interface TFile {
  path: string
  basename: string
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
  constructor(public message: string) {}
}

export class Setting {
  constructor(public containerEl: HTMLElement) {}
  addButton(): this {
    return this
  }
}

export class MarkdownView {}

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
