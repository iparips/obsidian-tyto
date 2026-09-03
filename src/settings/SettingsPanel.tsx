import { OwlSettings } from './settings'
import { AllowListEditor } from './AllowListEditor'
import { CommandSearch } from '../commands/command-search'
import { AllowedCommand } from '../commands/models/allowed-command'

export interface SettingsPanelProps {
  settings: OwlSettings
  onChange(update: Partial<OwlSettings>): void
  search: CommandSearch
  resolvedCommands: readonly AllowedCommand[]
}

export const SettingsPanel = ({
  settings,
  onChange,
  search,
  resolvedCommands,
}: SettingsPanelProps) => (
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
    <AllowListEditor
      entries={settings.commandAllowList}
      search={search}
      resolved={resolvedCommands}
      onChange={(commandAllowList) => onChange({ commandAllowList })}
    />
    <p className="owl-settings-note">
      Search for a command by the name shown in the command palette, or type an id or namespace
      pattern such as daily-notes:*. Owl can run these and no others.
    </p>
    <label className="owl-setting owl-setting-inline">
      <input
        type="checkbox"
        aria-label="Search the vault"
        checked={settings.searchEnabled}
        onChange={(event) => onChange({ searchEnabled: event.target.checked })}
      />
      Search the vault to answer questions
    </label>
    <p className="owl-settings-note">
      Owl can search your notes and summarise what it finds in the panel. The summary is never
      written into a note.
    </p>
    <p className="owl-settings-note">
      Your key is stored in this vault and only ever sent to the provider. Note content and
      instructions go to the provider when you use a session; nothing else leaves your device.
    </p>
  </div>
)
