import { useState } from 'react'
import { Entry } from '../models/panel-state'
import { EntryWeights } from '../models/entry-weight'
import { EntrySources } from './EntrySources'

const ENTRY_CLASSES = {
  user: 'owl-entry-user',
  assistant: 'owl-entry-assistant',
  error: 'owl-entry-error',
  instructions: 'owl-entry-instructions',
  command: 'owl-entry-command',
  answer: 'owl-entry-answer',
}

const entryText = (entry: Entry) =>
  entry.kind === 'error' ? `${entry.step} failed: ${entry.text}` : entry.text

export const HistoryEntry = ({ entry }: { entry: Entry }) => {
  const [copied, setCopied] = useState(false)
  const text = entryText(entry)
  const weight = EntryWeights.of(entry.kind)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`owl-entry owl-entry-${weight} ${ENTRY_CLASSES[entry.kind]}`}>
      <div className="owl-entry-body">
        <div className="owl-entry-text">{text}</div>
        {entry.kind === 'answer' && <EntrySources sources={entry.sources} />}
      </div>
      {weight === 'reply' && (
        <button
          className="owl-entry-copy"
          aria-label={copied ? 'Copied' : 'Copy entry'}
          onClick={copy}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      )}
    </div>
  )
}
