import { useState } from 'react'
import { Entry } from '../models/panel-state'
import { EntryWeights } from '../models/entry-weight'
import { EntrySources } from './EntrySources'
import { EntryChoice } from './EntryChoice'
import { EntrySuggestions } from './EntrySuggestions'
import { EntrySteps } from './EntrySteps'

const ENTRY_CLASSES = {
  user: 'tyto-entry-user',
  assistant: 'tyto-entry-assistant',
  error: 'tyto-entry-error',
  instructions: 'tyto-entry-instructions',
  answer: 'tyto-entry-answer',
  cancelled: 'tyto-entry-cancelled',
  choice: 'tyto-entry-choice-line',
  question: 'tyto-entry-question',
  warning: 'tyto-entry-warning',
  steps: 'tyto-entry-steps-line',
  restored: 'tyto-entry-restored',
}

const entryText = (entry: Entry) => {
  if (entry.kind === 'error') return `${entry.step} failed: ${entry.text}`
  return entry.kind === 'steps' ? '' : entry.text
}

export interface HistoryEntryProps {
  entry: Entry
  // Absent once the turn has ended, which is what leaves an unanswered question
  // on screen as a record rather than a live prompt (FR32).
  onChooseNote?(chosen: string | null): void
  onPickSuggestion?(suggestion: string): void
  onRetry?(): void
}

export const HistoryEntry = ({
  entry,
  onChooseNote,
  onPickSuggestion,
  onRetry,
}: HistoryEntryProps) => {
  const [copied, setCopied] = useState(false)
  const text = entryText(entry)
  const weight = EntryWeights.of(entry.kind)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`tyto-entry tyto-entry-${weight} ${ENTRY_CLASSES[entry.kind]}`}>
      <div className="tyto-entry-body">
        {entry.kind === 'steps' ? (
          <EntrySteps steps={entry.steps} />
        ) : (
          <div className="tyto-entry-text">{text}</div>
        )}
        {entry.kind === 'answer' && <EntrySources sources={entry.sources} />}
        {entry.kind === 'choice' && entry.pending && onChooseNote && (
          <EntryChoice candidates={entry.candidates} onChoose={onChooseNote} />
        )}
        {entry.kind === 'question' && entry.pending && onPickSuggestion && (
          <EntrySuggestions suggestions={entry.suggestions} onPick={onPickSuggestion} />
        )}
        {entry.kind === 'error' && entry.retryable && onRetry && (
          <button className="tyto-entry-retry" aria-label="Retry transcription" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
      {weight === 'reply' && (
        <button
          className="tyto-entry-copy"
          aria-label={copied ? 'Copied' : 'Copy entry'}
          onClick={copy}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      )}
    </div>
  )
}
