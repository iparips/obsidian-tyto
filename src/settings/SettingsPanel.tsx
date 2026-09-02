import { VoiceEditSettings } from './settings'

export interface SettingsPanelProps {
  settings: VoiceEditSettings
  onChange(update: Partial<VoiceEditSettings>): void
}

export const SettingsPanel = ({ settings, onChange }: SettingsPanelProps) => (
  <div className="owl-settings">
    <label className="owl-setting">
      Mistral API key
      <input
        type="password"
        aria-label="Mistral API key"
        value={settings.mistralApiKey}
        onChange={(event) => onChange({ mistralApiKey: event.target.value })}
      />
    </label>
    <label className="owl-setting">
      Edit model
      <input
        type="text"
        aria-label="Edit model"
        value={settings.editModel}
        onChange={(event) => onChange({ editModel: event.target.value })}
      />
    </label>
    <label className="owl-setting">
      Skills folder
      <input
        type="text"
        aria-label="Skills folder"
        value={settings.skillsPath}
        onChange={(event) => onChange({ skillsPath: event.target.value })}
      />
    </label>
    <p className="owl-settings-note">
      Vault folder holding agent skills. Their names and descriptions are sent with each
      instruction. Leave empty to disable.
    </p>
    <p className="owl-settings-note">
      Your key is stored in this vault and only ever sent to the provider. Note content and
      instructions go to the provider when you use a session; nothing else leaves your device.
    </p>
  </div>
)
