import { useState } from 'react'
import { CommandSearch } from '../commands/command-search'
import { CommandMatchRow } from './CommandMatchRow'

export interface CommandPickerProps {
  entries: readonly string[]
  search: CommandSearch
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
    <div className="owl-command-picker">
      <label className="owl-setting">
        Find a command
        <input
          type="search"
          aria-label="Find a command"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <ul className="owl-command-matches" aria-label="Matching commands">
        {results.matches.map((match) => (
          <CommandMatchRow key={match.command.id} match={match} onAdd={add} />
        ))}
      </ul>
      {results.overflowed && (
        <p className="owl-settings-note">
          More commands matched than are shown. Type more to narrow the list.
        </p>
      )}
    </div>
  )
}
