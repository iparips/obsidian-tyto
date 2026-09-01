export interface VoiceEditSettings {
  provider: 'mistral'
  mistralApiKey: string
  editModel: string
  skillsPath: string
}

export const DEFAULT_SETTINGS: VoiceEditSettings = {
  provider: 'mistral',
  mistralApiKey: '',
  editModel: 'mistral-medium-latest',
  skillsPath: '0 - Meta/Skills',
}
