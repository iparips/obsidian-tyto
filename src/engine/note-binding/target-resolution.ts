import { ResolvedNote } from './resolved-note'

// What resolving the session's target found. Three states rather than a note
// and a failure, because "no note" and "a note nothing can show" are different
// facts about a session and only one of them names a note.
export type TargetResolution = TargetResolved | NoNoteBound | ResolutionFailed

// The session names a markdown note. An editor is showing it, or none is and
// the write goes through the vault.
export class TargetResolved {
  constructor(readonly resolvedNote: ResolvedNote) {}

  hasFailed(): this is ResolutionFailed {
    return false
  }

  noteOrNull(): ResolvedNote | null {
    return this.resolvedNote
  }
}

// The session names no note at all. A turn still opens on this: it searches,
// reads and answers, and refuses only the edits.
export class NoNoteBound {
  hasFailed(): this is ResolutionFailed {
    return false
  }

  noteOrNull(): ResolvedNote | null {
    return null
  }
}

// The session names a path that can never have a markdown editor: a canvas, a
// PDF, a Bases file. Carries the path, since telling the user which note they
// lost is the whole point of failing rather than opening an unbound turn.
//
// A note with no editor is not this. It resolves and writes through the vault,
// which costs undo; vault-writing one of these would rewrite its JSON as
// markdown, which is worse than refusing the turn.
export class ResolutionFailed {
  constructor(
    readonly path: string,
    readonly reason: string,
  ) {}

  // Narrows rather than returning a plain boolean, so a caller that checks it
  // reaches path and reason without a cast, the way Outcome does.
  hasFailed(): this is ResolutionFailed {
    return true
  }

  noteOrNull(): ResolvedNote | null {
    return null
  }
}
