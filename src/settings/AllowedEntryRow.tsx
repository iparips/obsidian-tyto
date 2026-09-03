import { useEffect, useState } from 'react'
import { AllowList } from '../commands/allow-list'

export interface AllowedEntryRowProps {
  entry: string
  onEdit(entry: string): void
  onRemove(): void
}

// The draft holds what the user typed, so a half-written pattern is shown with
// its reason rather than discarded (FR13). What the entry reaches is resolved
// once for the whole list, in the section below it.
export const AllowedEntryRow = ({ entry, onEdit, onRemove }: AllowedEntryRowProps) => {
  const [draft, setDraft] = useState(entry)
  useEffect(() => setDraft(entry), [entry])
  const error = AllowList.validate(draft)

  const publish = (edited: string) => {
    setDraft(edited)
    onEdit(edited)
  }

  return (
    <li className="owl-allowed-entry">
      <div className="owl-allowed-entry-line">
        <input
          type="text"
          aria-label={`Entry ${entry}`}
          value={draft}
          onChange={(event) => publish(event.target.value)}
        />
        <button type="button" onClick={onRemove}>
          {`Remove ${entry}`}
        </button>
      </div>
      {error && (
        <p className="owl-settings-error" role="alert">
          {error}
        </p>
      )}
    </li>
  )
}
