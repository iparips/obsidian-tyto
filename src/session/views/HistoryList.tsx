import { HistoryEntry } from './HistoryEntry'
import { Entry } from '../models/panel-state'

export const HistoryList = ({ entries }: { entries: Entry[] }) => (
  <div className="voice-edit-history">
    {entries.map((entry, index) => (
      <HistoryEntry key={index} entry={entry} />
    ))}
  </div>
)
