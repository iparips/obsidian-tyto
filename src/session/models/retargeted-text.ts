import { NoteName } from './note-name'

// The line a retarget leaves on the timeline, marking where the session moved
// from one note to another. It is a session event rather than a turn step: it
// belongs to the moment it happened, not to whichever turn was open.
//
// An unbound session has no note to name, which is what a command closing the
// last note leaves behind. The line says the binding went rather than naming a
// path it does not have.
export class RetargetedText {
  static of(path: string | null): string {
    return path === null ? 'No note is bound to this session.' : `Now editing ${NoteName.of(path)}.`
  }
}
