import { useEffect, useState } from 'react'
import { AllowList } from '../commands/allow-list'

export interface AllowedEntriesProps {
  entries: readonly string[]
  onChange(entries: string[]): void
}

// One entry per line. A textarea adds, edits, removes and reorders with no
// per-row controls, which a list of inputs needed one of each for.
export const AllowedEntries = ({ entries, onChange }: AllowedEntriesProps) => {
  // The draft holds what the user typed, blank lines and all. Settings store a
  // trimmed array, so without this a newline is stripped as soon as it is typed
  // and a second entry cannot be started.
  const [draft, setDraft] = useState(entries.join('\n'))
  const [errors, setErrors] = useState<readonly string[]>([])

  // The picker writes entries too, so the draft follows settings when they
  // change underneath it.
  useEffect(() => setDraft(entries.join('\n')), [entries])

  const publish = (text: string) => {
    setDraft(text)
    onChange(entriesOf(text))
  }

  // Validated on blur, not per keystroke: a half-typed entry is invalid on its
  // way to being valid, and saying so mid-word is noise.
  const validate = () => setErrors(errorsOf(entriesOf(draft)))

  return (
    <label className="owl-allowed-entries">
      Allowed commands
      <textarea
        aria-label="Allowed commands"
        rows={4}
        value={draft}
        onChange={(event) => publish(event.target.value)}
        onBlur={validate}
      />
      {errors.length > 0 && (
        <p className="owl-settings-error" role="alert">
          {errors.join('; ')}
        </p>
      )}
    </label>
  )
}

const entriesOf = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

const errorsOf = (entries: readonly string[]): string[] =>
  entries
    .map((entry) => AllowList.validate(entry))
    .filter((error): error is string => error !== null)
