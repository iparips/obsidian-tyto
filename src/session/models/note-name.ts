// A note's short name, derived from a path rather than read off a TFile: a note
// a command moved mid-turn arrives as a path, and so does a restored session's
// target, which holds no basename. What the panel shows is the whole path,
// since weekly notes repeat their names; this is how a session is identified.
export class NoteName {
  static of(path: string): string {
    return path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, '')
  }
}
