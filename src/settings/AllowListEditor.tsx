import { ObsidianCommandSearch } from '../commands/obsidian-command-search'
import { AllowedObsidianCommand } from '../commands/models/allowed-obsidian-command'
import { AllowedEntries } from './AllowedEntries'
import { CommandPicker } from './CommandPicker'
import { ResolvedCommands } from './ResolvedCommands'

export interface AllowListEditorProps {
  entries: string[]
  search: ObsidianCommandSearch
  resolved: readonly AllowedObsidianCommand[]
  onChange(entries: string[]): void
}

// The picker finds a command to allow; the list holds what is allowed; the
// section below says what those entries currently reach.
export const AllowListEditor = ({ entries, search, resolved, onChange }: AllowListEditorProps) => (
  <div className="tyto-allow-list-editor">
    <CommandPicker entries={entries} search={search} onChange={onChange} />
    <div className="tyto-allow-list-entries">
      <AllowedEntries entries={entries} onChange={onChange} />
      <ResolvedCommands commands={resolved} />
    </div>
  </div>
)
