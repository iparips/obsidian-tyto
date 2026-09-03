import { CommandSearch } from '../commands/command-search'
import { AllowedCommand } from '../commands/models/allowed-command'
import { AllowedEntries } from './AllowedEntries'
import { CommandPicker } from './CommandPicker'
import { ResolvedCommands } from './ResolvedCommands'

export interface AllowListEditorProps {
  entries: string[]
  search: CommandSearch
  resolved: readonly AllowedCommand[]
  onChange(entries: string[]): void
}

// The picker finds a command to allow; the list holds what is allowed; the
// section below says what those entries currently reach.
export const AllowListEditor = ({ entries, search, resolved, onChange }: AllowListEditorProps) => (
  <div className="owl-allow-list-editor">
    <CommandPicker entries={entries} search={search} onChange={onChange} />
    <div>
      <p className="owl-allow-list-heading">Allowed commands</p>
      <AllowedEntries entries={entries} onChange={onChange} />
      <ResolvedCommands commands={resolved} />
    </div>
  </div>
)
