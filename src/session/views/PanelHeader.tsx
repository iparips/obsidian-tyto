import { useState } from 'react'

// The note left with the turns, since a target belongs to the turn that chose
// it and a header naming one cannot say which utterance it belongs to (D4).
// What is left is a toolbar, and reads as one.
export interface PanelHeaderProps {
  running: boolean
  onReset?(): void
  // Absent unless the setting is on, the way Reset is absent without onReset: a
  // greyed control with nothing naming the setting reads as broken.
  onCopy?(): string
  // False before the first entry lands, so a session with nothing to copy does
  // not offer to.
  hasEntries?: boolean
}

export const PanelHeader = ({ running, onReset, onCopy, hasEntries }: PanelHeaderProps) => {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!onCopy) return
    await navigator.clipboard.writeText(onCopy())
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="tyto-header">
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
