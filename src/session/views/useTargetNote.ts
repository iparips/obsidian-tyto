import { useEffect, useState } from 'react'

export interface TargetNotePorts {
  // Null while the session is unbound, which the header says rather than naming
  // a note.
  noteName: string | null
  // The path from the vault root, beneath the name, so two notes sharing a name
  // are told apart (FR14).
  notePath?: string | null
  onTargetNoteChanged?(listener: (path: string) => void): () => void
}

export interface TargetNote {
  name: string | null
  path: string | null
}

// The note the edit tools now target, which a command may have moved mid-turn
// (FR19). Held apart from the reducer because the header reads it directly and
// no action in the panel changes it.
export const useTargetNote = (ports: TargetNotePorts): TargetNote => {
  const [name, setName] = useState(ports.noteName)
  const [path, setPath] = useState(ports.notePath ?? null)

  useEffect(
    () =>
      ports.onTargetNoteChanged?.((changedTo) => {
        setName(noteNameOf(changedTo))
        setPath(changedTo)
      }),
    [],
  )

  return { name, path }
}

const noteNameOf = (path: string): string =>
  path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, '')
