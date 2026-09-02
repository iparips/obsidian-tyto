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

export interface Command {
  id: string
  name: string
  checkCallback?(checking: boolean): boolean | void
}

export interface Workspace {
  getActiveFile(): TFile | null
}

export type SearchMatchPart = [number, number]
export type SearchMatches = SearchMatchPart[]

export interface SearchResult {
  score: number
  matches: SearchMatches
}

export interface Vault {
  getMarkdownFiles(): TFile[]
  cachedRead(file: TFile): Promise<string>
  getAbstractFileByPath(path: string): TAbstractFile | null
}

// Stands in for Obsidian's own scorer: every occurrence of the query scores one
// point, so a test can assert that two matches outrank one.
export const prepareSimpleSearch =
  (query: string) =>
  (text: string): SearchResult | null => {
    const matches = occurrencesOf(text.toLowerCase(), query.trim().toLowerCase())
    return matches.length === 0 ? null : { score: matches.length, matches }
  }

const occurrencesOf = (text: string, needle: string): SearchMatches => {
  const matches: SearchMatches = []
  if (!needle) return matches
  for (let at = text.indexOf(needle); at !== -1; at = text.indexOf(needle, at + needle.length))
    matches.push([at, at + needle.length])
  return matches
}
