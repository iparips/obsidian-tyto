import { ObsidianCommandSearch } from '../../commands/obsidian-command-search'
import { AllowedObsidianCommand } from '../../commands/models/allowed-obsidian-command'
import { TytoSettings } from '../settings'

// What the settings tab cannot assemble for itself, since only wiring knows how
// a registry, a search and a catalogue fit together. Saving an edit is the
// tab's, so onChange is not among them.
export interface AllowListEditorInputs {
  settings: TytoSettings
  search: ObsidianCommandSearch
  resolvedCommands: readonly AllowedObsidianCommand[]
}
