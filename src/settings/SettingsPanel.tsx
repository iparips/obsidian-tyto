import { TytoSettings } from './settings'
import { AllowListEditor } from './AllowListEditor'
import { ObsidianCommandSearch } from '../commands/obsidian-command-search'
import { AllowedObsidianCommand } from '../commands/models/allowed-obsidian-command'

export interface SettingsPanelProps {
  settings: TytoSettings
  onChange(update: Partial<TytoSettings>): void
  search: ObsidianCommandSearch
  resolvedCommands: readonly AllowedObsidianCommand[]
}

export const SettingsPanel = ({
  settings,
  onChange,
  search,
  resolvedCommands,
}: SettingsPanelProps) => (
  <div className="tyto-settings">
    <label className="tyto-setting">
      Mistral API key
      <input
        type="password"
        aria-label="Mistral API key"
        value={settings.mistralApiKey}
        onChange={(event) => onChange({ mistralApiKey: event.target.value })}
      />
    </label>
    <label className="tyto-setting">
      Edit model
      <input
        type="text"
        aria-label="Edit model"
        value={settings.editModel}
        onChange={(event) => onChange({ editModel: event.target.value })}
      />
    </label>
    <label className="tyto-setting">
      Skills folder
      <input
        type="text"
        aria-label="Skills folder"
        value={settings.skillsPath}
        onChange={(event) => onChange({ skillsPath: event.target.value })}
      />
    </label>
    <p className="tyto-settings-note">
      Vault folder holding agent skills. Their names and descriptions are sent with each
      instruction. Leave empty to disable.
    </p>
    <AllowListEditor
      entries={settings.commandAllowList}
      search={search}
      resolved={resolvedCommands}
      onChange={(commandAllowList) => onChange({ commandAllowList })}
    />
    <p className="tyto-settings-note">
      Search for a command by the name shown in the command palette, or type an id or namespace
      pattern such as daily-notes:*. Tyto can run these and no others.
    </p>
    <label className="tyto-setting tyto-setting-inline">
      <input
        type="checkbox"
        aria-label="Search the vault"
        checked={settings.searchEnabled}
        onChange={(event) => onChange({ searchEnabled: event.target.checked })}
      />
      Search the vault to answer questions
    </label>
    <p className="tyto-settings-note">
      Tyto can search your notes and summarise what it finds in the panel. The summary is never
      written into a note.
    </p>
    <label className="tyto-setting tyto-setting-inline">
      <input
        type="checkbox"
        aria-label="Copy the session transcript"
        checked={settings.transcriptCopyEnabled}
        onChange={(event) => onChange({ transcriptCopyEnabled: event.target.checked })}
      />
      Copy the session transcript
    </label>
    <p className="tyto-settings-note">
      Adds a Copy button to the panel header. The transcript holds the whole session as Markdown,
      including your note text and any vault instructions, so a turn that went wrong can be filed
      rather than described. Your key is never in it.
    </p>
    <label className="tyto-setting tyto-setting-inline">
      <input
        type="checkbox"
        aria-label="Choose the note Tyto opens"
        checked={settings.openMode === 'confirm'}
        onChange={(event) => onChange({ openMode: event.target.checked ? 'confirm' : 'auto' })}
      />
      Ask which note Tyto should open
    </label>
    <p className="tyto-settings-note">
      Tyto can search for the note an instruction names and open it. With this on, it shows you the
      notes it found and waits for you to pick one. A note one of your commands opens never asks.
    </p>
    <p className="tyto-settings-note">
      Your key is stored in this vault and only ever sent to the provider. Note content and
      instructions go to the provider when you use a session; nothing else leaves your device.
    </p>
  </div>
)
