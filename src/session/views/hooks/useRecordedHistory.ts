import { useReducer, useRef } from 'react'
import { AskedEntries } from '../../models/asked-entries'
import { PanelAction } from '../../models/panel-action'
import { PanelItem, PanelState } from '../../models/panel-state'
import { PanelReducer } from '../../models/panel-reducer'

// The one thing the panel cannot hold for itself: a record that outlives it.
// Optional because the panel renders without one, and a session built before
// the recorder existed supplies none.
export interface RecordedHistoryPorts {
  recordHistory?(entries: readonly PanelItem[]): void
}

// The stored phase is never read: the turn that set a running phase went with
// the WebView, so a restored session opens idle whatever it was doing (FR5).
// turnEnded settles the entries and carries the phase through unchanged,
// because every caller in the reducer sets the phase itself, so idle is set
// here rather than by it.
const restoredState = (entries: PanelItem[]): PanelState =>
  AskedEntries.turnEnded(new PanelState('idle', entries))

// The reducer, plus the record that follows every dispatch. Recording here
// rather than from an effect is the point: an effect runs only after a render,
// and the dispatch that ends a turn the user closed the panel on never gets one.
export const useRecordedHistory = (
  ports: RecordedHistoryPorts,
  entries: PanelItem[],
): [PanelState, (action: PanelAction) => void] => {
  const [state, dispatch] = useReducer(PanelReducer.reduce, entries, restoredState)
  // The live state, since the closure over state is the render's, and two
  // dispatches in one tick would record the first one's entries twice.
  const latest = useRef(state)

  const recordingDispatch = (action: PanelAction): void => {
    latest.current = PanelReducer.reduce(latest.current, action)
    dispatch(action)
    ports.recordHistory?.(latest.current.entries)
  }

  return [state, recordingDispatch]
}
