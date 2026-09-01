import { VoiceEditSettings } from './settings'

export interface SettingsPanelProps {
  settings: VoiceEditSettings
  onChange(update: Partial<VoiceEditSettings>): void
}

export const SettingsPanel = ({ settings, onChange }: SettingsPanelProps) => (
  <div className="voice-edit-settings">
    <label className="voice-edit-setting">
      Mistral API key
      <input
        type="password"
        aria-label="Mistral API key"
        value={settings.mistralApiKey}
        onChange={(event) => onChange({ mistralApiKey: event.target.value })}
      />
    </label>
    <label className="voice-edit-setting">
      Edit model
      <input
        type="text"
        aria-label="Edit model"
        value={settings.editModel}
        onChange={(event) => onChange({ editModel: event.target.value })}
      />
    </label>
    <label className="voice-edit-setting">
      Skills folder
      <input
        type="text"
        aria-label="Skills folder"
        value={settings.skillsPath}
        onChange={(event) => onChange({ skillsPath: event.target.value })}
      />
    </label>
    <p className="voice-edit-settings-note">
      Vault folder holding agent skills. Their names and descriptions are sent with each
      instruction. Leave empty to disable.
    </p>
    <p className="voice-edit-settings-note">
      Your key is stored in this vault and only ever sent to the provider. Note content and
      instructions go to the provider when you use a session; nothing else leaves your device.
    </p>
  </div>
)
