import { useState } from 'react'
import { AllowedCommand } from '../commands/models/allowed-command'
import { AllowList } from '../commands/allow-list'
import { ResolvedCommands } from './ResolvedCommands'

export interface AllowListEditorProps {
  entries: string[]
  resolved: readonly AllowedCommand[]
  onChange(entries: string[]): void
}

// One entry per line: a textarea scrolls on a phone and needs no per-row
// controls, which a list of inputs would (FR8).
export const AllowListEditor = ({ entries, resolved, onChange }: AllowListEditorProps) => {
  // The draft holds what the user typed, blank lines and all. Settings store a
  // trimmed array, so without this a newline is stripped as soon as it is typed
  // and a second entry cannot be started.
  const [draft, setDraft] = useState(entries.join('\n'))
  const errors = entriesOf(draft)
    .map((entry) => AllowList.validate(entry))
    .filter(Boolean)

  const publish = (text: string) => {
    setDraft(text)
    onChange(entriesOf(text))
  }

  return (
    <div className="owl-setting">
      <label className="owl-setting">
        Allowed commands
        <textarea
          aria-label="Allowed commands"
          rows={4}
          value={draft}
          onChange={(event) => publish(event.target.value)}
        />
      </label>
      {errors.length > 0 && (
        <p className="owl-settings-error" role="alert">
          {errors.join('; ')}
        </p>
      )}
      <ResolvedCommands commands={resolved} />
    </div>
  )
}

const entriesOf = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
