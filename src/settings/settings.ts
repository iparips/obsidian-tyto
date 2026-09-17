// Confirm is the default: a user who has not thought about this gets the mode
// that cannot surprise them (FR9).
export type OpenMode = 'confirm' | 'auto'

export interface TytoSettings {
  provider: 'mistral'
  mistralApiKey: string
  editModel: string
  skillsPath: string
  commandAllowList: string[]
  searchEnabled: boolean
  openMode: OpenMode
  // Off by default: the transcript carries note text and vault instructions
  // verbatim, so copying one is the user's decision rather than the default.
  transcriptCopyEnabled: boolean
}

export const DEFAULT_SETTINGS: TytoSettings = {
  provider: 'mistral',
  mistralApiKey: '',
  editModel: 'mistral-medium-latest',
  skillsPath: '0 - Meta/Skills',
  // Opening the daily note creates or reveals one note and destroys nothing,
  // so it is the one command worth shipping allowed. No colon: Obsidian's core
  // commands are not namespaced, and daily-notes:* would match none of them.
  commandAllowList: ['daily-notes'],
  searchEnabled: false,
  openMode: 'confirm',
  transcriptCopyEnabled: false,
}
