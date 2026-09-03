import { HistoryEntry } from './HistoryEntry'
import { PendingEntry } from './PendingEntry'
import { Entry, Phase } from '../models/panel-state'

export const HistoryList = ({ entries, phase }: { entries: Entry[]; phase: Phase }) => (
  <div className="owl-history">
    {entries.map((entry, index) => (
      <HistoryEntry key={index} entry={entry} />
    ))}
    <PendingEntry phase={phase} />
  </div>
)
