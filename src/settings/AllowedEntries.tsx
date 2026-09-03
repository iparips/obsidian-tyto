import { AllowedEntryRow } from './AllowedEntryRow'

export interface AllowedEntriesProps {
  entries: readonly string[]
  onChange(entries: string[]): void
}

// Ids and patterns, editable in place. Names live in the resolution section, so
// a row stays scannable and nothing resolved is ever stored (NFR1).
export const AllowedEntries = ({ entries, onChange }: AllowedEntriesProps) => {
  const edit = (index: number, entry: string) =>
    onChange(entries.map((existing, at) => (at === index ? entry : existing)))

  const remove = (index: number) => onChange(entries.filter((_, at) => at !== index))

  return (
    <ul className="owl-allowed-entries" aria-label="Allowed commands">
      {entries.map((entry, index) => (
        <AllowedEntryRow
          key={index}
          entry={entry}
          onEdit={(edited) => edit(index, edited)}
          onRemove={() => remove(index)}
        />
      ))}
    </ul>
  )
}
