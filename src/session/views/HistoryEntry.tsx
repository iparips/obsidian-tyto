import { useState } from 'react'
import { PanelEntry } from '../models/panel-state'
import { EntryWeights } from '../models/entry-weight'
import { EntrySources } from './EntrySources'
import { EntryChoice } from './EntryChoice'
import { EntrySuggestions } from './EntrySuggestions'

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
  progress: 'tyto-entry-progress-line',
  restored: 'tyto-entry-restored',
}

// A progress entry is rendered by HistoryTurn, which holds the target its lines
// are compared against, so it never reaches here and carries no text.
const entryText = (entry: PanelEntry) => {
  if (entry.kind === 'error') return `${entry.step} failed: ${entry.text}`
  return entry.kind === 'progress' ? '' : entry.text
}

export interface HistoryEntryProps {
  entry: PanelEntry
  // Absent once the turn has ended, which is what leaves an unanswered question
  // on screen as a record rather than a live prompt (FR32).
  onChooseNote?: (chosen: string | null) => void
  onPickSuggestion?: (suggestion: string) => void
  onRetry?: () => void
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

  // A clipboard the vault has not granted rejects, and the label stays put:
  // saying Copied when nothing was copied is the one wrong answer here.
  const copy = () => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      },
      () => {},
    )
  }

  return (
    <div className={`tyto-entry tyto-entry-${weight} ${ENTRY_CLASSES[entry.kind]}`}>
      <div className="tyto-entry-body">
        <div className="tyto-entry-text">{text}</div>
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
