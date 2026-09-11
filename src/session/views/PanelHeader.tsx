import { useState } from 'react'

export interface PanelHeaderProps {
  // Null while the session is unbound, which the header says rather than naming
  // a note.
  name: string | null
  // The path from the vault root, beneath the name, so two notes sharing a name
  // are told apart (FR14).
  path: string | null
  running: boolean
  onReset?(): void
  // Absent unless the setting is on, the way Reset is absent without onReset: a
  // greyed control with nothing naming the setting reads as broken.
  onCopy?(): string
  // False before the first entry lands, so a session with nothing to copy does
  // not offer to.
  hasEntries?: boolean
}

export const PanelHeader = ({
  name,
  path,
  running,
  onReset,
  onCopy,
  hasEntries,
}: PanelHeaderProps) => {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!onCopy) return
    await navigator.clipboard.writeText(onCopy())
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="tyto-header">
      <div className="tyto-header-target">
        <span className="tyto-header-name">{name ?? NO_NOTE_BOUND}</span>
        {path && (
          <span className="tyto-header-path" aria-label="Note path">
            {path}
          </span>
        )}
      </div>
      {onCopy && (
        <button
          className="tyto-copy-transcript"
          aria-label={copied ? 'Copied' : 'Copy transcript'}
          disabled={running || !hasEntries}
          onClick={copy}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      )}
      {onReset && (
        <button
          className="tyto-new-session"
          aria-label="Reset session"
          disabled={running}
          onClick={onReset}
        >
          Reset
        </button>
      )}
    </div>
  )
}

const NO_NOTE_BOUND = 'No note open'
