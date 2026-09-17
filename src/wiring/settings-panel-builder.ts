import { App } from 'obsidian'
import { AllowList } from '../commands/allow-list'
import { ObsidianCommandCatalogue } from '../commands/obsidian-command-catalogue'
import { ObsidianCommandRegistry } from '../commands/obsidian-command-registry'
import { ObsidianCommandSearch } from '../commands/obsidian-command-search'
import { AllowListEditorInputs } from '../settings/views/allow-list-editor-inputs'
import { TytoSettings } from '../settings/settings'

// Assembles the allow-list editor's collaborators. Built fresh on every call
// rather than held: the allow-list is read off the settings the user is
// editing, so a search built once would answer against the entries as they
// stood when the tab opened.
export class SettingsPanelBuilder {
  constructor(
    private app: App,
    private readSettingsFn: () => TytoSettings,
  ) {}

  build(): AllowListEditorInputs {
    const settings = this.readSettingsFn()
    const registry = new ObsidianCommandRegistry(this.app)
    const allowList = new AllowList(settings.commandAllowList)
    return {
      settings,
      search: new ObsidianCommandSearch(registry, allowList),
      resolvedCommands: new ObsidianCommandCatalogue(registry, allowList).resolve(),
    }
  }
}
