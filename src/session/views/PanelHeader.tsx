import { useState } from 'react'
import { TytoOwl } from './TytoOwl'

// The note left with the turns, since a target belongs to the turn that chose
// it and a header naming one cannot say which utterance it belongs to (D4).
// What names the panel is the title, which says the same thing in every state
// and so takes no props.
export interface PanelHeaderProps {
  running: boolean
  onReset?: () => void
  // Absent unless the setting is on, the way Reset is absent without onReset: a
  // greyed control with nothing naming the setting reads as broken.
  onCopy?: () => string
  // False before the first entry lands, so a session with nothing to copy does
  // not offer to.
  hasEntries?: boolean
}

export const PanelHeader = ({ running, onReset, onCopy, hasEntries }: PanelHeaderProps) => {
  const [copied, setCopied] = useState(false)

  // A clipboard the vault has not granted rejects, and the label stays put:
  // saying Copied when nothing was copied is the one wrong answer here.
  const copy = () => {
    if (!onCopy) return
    navigator.clipboard.writeText(onCopy()).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      },
      () => {},
    )
  }

  return (
    <div className="tyto-header">
      <span className="tyto-header-title">
        <TytoOwl />
        Tyto session
      </span>
      <span className="tyto-header-actions">
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
      </span>
    </div>
  )
}
