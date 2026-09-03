import { useState } from 'react'
import { Entry } from '../models/panel-state'
import { EntryWeights } from '../models/entry-weight'
import { EntrySources } from './EntrySources'
import { EntryConfirm } from './EntryConfirm'
import { EntrySuggestions } from './EntrySuggestions'
import { EntrySteps } from './EntrySteps'

const ENTRY_CLASSES = {
  user: 'owl-entry-user',
  assistant: 'owl-entry-assistant',
  error: 'owl-entry-error',
  instructions: 'owl-entry-instructions',
  command: 'owl-entry-command',
  answer: 'owl-entry-answer',
  cancelled: 'owl-entry-cancelled',
  confirm: 'owl-entry-confirm-line',
  question: 'owl-entry-question',
  warning: 'owl-entry-warning',
  steps: 'owl-entry-steps-line',
}

const entryText = (entry: Entry) => {
  if (entry.kind === 'error') return `${entry.step} failed: ${entry.text}`
  return entry.kind === 'steps' ? '' : entry.text
}

export interface HistoryEntryProps {
  entry: Entry
  // Absent once the turn has ended, which is what leaves an unanswered question
  // on screen as a record rather than a live prompt (FR32).
  onAnswerOpen?(granted: boolean): void
  onPickSuggestion?(suggestion: string): void
}

export const HistoryEntry = ({ entry, onAnswerOpen, onPickSuggestion }: HistoryEntryProps) => {
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
        {entry.kind === 'steps' ? (
          <EntrySteps steps={entry.steps} />
        ) : (
          <div className="owl-entry-text">{text}</div>
        )}
        {entry.kind === 'answer' && <EntrySources sources={entry.sources} />}
        {entry.kind === 'confirm' && entry.pending && onAnswerOpen && (
          <EntryConfirm onAnswer={onAnswerOpen} />
        )}
        {entry.kind === 'question' && entry.pending && onPickSuggestion && (
          <EntrySuggestions suggestions={entry.suggestions} onPick={onPickSuggestion} />
        )}
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
