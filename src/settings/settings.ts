export interface OwlSettings {
  provider: 'mistral'
  mistralApiKey: string
  editModel: string
  skillsPath: string
  commandAllowList: string[]
  searchEnabled: boolean
}

export const DEFAULT_SETTINGS: OwlSettings = {
  provider: 'mistral',
  mistralApiKey: '',
  editModel: 'mistral-medium-latest',
  skillsPath: '0 - Meta/Skills',
  commandAllowList: ['daily-notes:*'],
  searchEnabled: true,
}
