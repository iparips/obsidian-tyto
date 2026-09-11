import { useState } from 'react'
import { ObsidianCommandSearch } from '../commands/obsidian-command-search'
import { CommandMatchRow } from './CommandMatchRow'

export interface CommandPickerProps {
  entries: readonly string[]
  search: ObsidianCommandSearch
  onChange(entries: string[]): void
}

// Nothing renders before a query is typed: a vault offers several hundred
// commands, so the query is what makes the list finite (FR1, FR4).
export const CommandPicker = ({ entries, search, onChange }: CommandPickerProps) => {
  const [query, setQuery] = useState('')
  const results = search.matching(query)

  // Clearing the query closes the results: the pick is made, and a list left
  // open over the entries it just changed hides the outcome.
  const add = (commandId: string) => {
    setQuery('')
    onChange([...entries, commandId])
  }

  return (
    <div className="tyto-command-picker">
      <label className="tyto-setting">
        Find a command
        <input
          type="search"
          aria-label="Find a command"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <ul className="tyto-command-matches" aria-label="Matching commands">
        {results.matches.map((match) => (
          <CommandMatchRow key={match.command.id} match={match} onAdd={add} />
        ))}
      </ul>
      {results.overflowed && (
        <p className="tyto-settings-note">
          More commands matched than are shown. Type more to narrow the list.
        </p>
      )}
    </div>
  )
}
