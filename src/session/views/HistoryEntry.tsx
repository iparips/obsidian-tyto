import { useState } from 'react'
import { Entry } from '../models/panel-state'

const ENTRY_CLASSES = {
  user: 'voice-edit-entry-user',
  assistant: 'voice-edit-entry-assistant',
  error: 'voice-edit-entry-error',
  instructions: 'voice-edit-entry-instructions',
}

const entryText = (entry: Entry) =>
  entry.kind === 'error' ? `${entry.step} failed: ${entry.text}` : entry.text

export const HistoryEntry = ({ entry }: { entry: Entry }) => {
  const [copied, setCopied] = useState(false)
  const text = entryText(entry)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`voice-edit-entry ${ENTRY_CLASSES[entry.kind]}`}>
      <div className="voice-edit-entry-text">{text}</div>
      <button
        className="voice-edit-entry-copy"
        aria-label={copied ? 'Copied' : 'Copy entry'}
        onClick={copy}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
