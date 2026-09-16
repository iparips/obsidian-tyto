import { useEffect, useState } from 'react'
import { RetargetReport } from '../../session-listeners'

export interface TargetNotePorts {
  // Null while the session is unbound, which a turn shows as no note.
  noteName: string | null
  // The path from the vault root, which is what a turn opens on and what names
  // it (FR14).
  notePath?: string | null
  onTargetNoteChanged?(listenerFn: (report: RetargetReport) => void): () => void
}

// The note the session is on, which is the target a turn starts with (D5).
// Held apart from the reducer because no action in the panel changes it: the
// workspace does, and an utterance reads it as it stands.
export const useTargetNote = (ports: TargetNotePorts): string | null => {
  const [path, setPath] = useState(ports.notePath ?? null)

  useEffect(() => ports.onTargetNoteChanged?.(({ path: changedTo }) => setPath(changedTo)), [])

  return path
}
