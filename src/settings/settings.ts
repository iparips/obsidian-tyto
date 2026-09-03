// Confirm is the default: a user who has not thought about this gets the mode
// that cannot surprise them (FR9).
export type OpenMode = 'confirm' | 'auto'

export interface OwlSettings {
  provider: 'mistral'
  mistralApiKey: string
  editModel: string
  skillsPath: string
  commandAllowList: string[]
  searchEnabled: boolean
  openMode: OpenMode
}

export const DEFAULT_SETTINGS: OwlSettings = {
  provider: 'mistral',
  mistralApiKey: '',
  editModel: 'mistral-medium-latest',
  skillsPath: '0 - Meta/Skills',
  commandAllowList: ['daily-notes:*'],
  searchEnabled: true,
  openMode: 'confirm',
}
