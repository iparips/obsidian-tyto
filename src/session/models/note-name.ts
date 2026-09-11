// The name the header shows, derived from a path rather than read off a TFile:
// a note a command moved mid-turn arrives as a path, and so does a restored
// session's target, which holds no basename.
export class NoteName {
  static of(path: string): string {
    return path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, '')
  }
}
