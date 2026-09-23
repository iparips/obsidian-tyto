// A note path as a wikilink, `[[path|name]]` or `[[path]]`, with the target
// being everything up to the pipe. The `.md` is dropped in a link, so a path is
// compared without it.
const WIKILINK_TARGET = /\[\[([^\]|]+)/g

const MARKDOWN_EXTENSION = /\.md$/

// A reply that names notes a search returned without linking any of them. The
// prompt asks for an inline wikilink and the model writes the path in bold or in
// a fenced block instead, which reads as a citation and is not one: the reader
// cannot click it, and a bare name resolves to whichever folder the vault picks.
//
// Judged on the reply the model wrote rather than on what it searched, because a
// turn may legitimately name no note at all.
export class UncitedReply {
  private constructor(private readonly uncited: readonly string[]) {}

  // The paths come from the search repository, so a path the model invented is
  // not one this asks about: an invented path is already refused at the open.
  static inReply(reply: string, pathsFound: readonly string[]): UncitedReply {
    const linked = UncitedReply.linkedTargets(reply)
    const named = pathsFound.filter((path) => UncitedReply.namesPath(reply, path))
    return new UncitedReply(named.filter((path) => !UncitedReply.isLinked(path, linked)))
  }

  // Every wikilink target the reply carries, each without its extension, so a
  // link written with or without `.md` counts as the same citation.
  private static linkedTargets(reply: string): string[] {
    return [...reply.matchAll(WIKILINK_TARGET)].map((match) =>
      UncitedReply.withoutExtension(match[1].trim()),
    )
  }

  // The path as text anywhere in the reply, whatever decoration is around it:
  // bold, backticks and a fenced block all leave the path itself intact.
  private static namesPath(reply: string, path: string): boolean {
    return reply.includes(UncitedReply.withoutExtension(path))
  }

  // A link cites the path when it targets it, and a link to a note inside a
  // folder does not cite the folder's own note, which is why the targets are
  // compared whole rather than by prefix.
  private static isLinked(path: string, linked: readonly string[]): boolean {
    return linked.includes(UncitedReply.withoutExtension(path))
  }

  private static withoutExtension(path: string): string {
    return path.replace(MARKDOWN_EXTENSION, '')
  }

  hasUncitedPaths(): boolean {
    return this.uncited.length > 0
  }

  // Names the paths, since a reply naming three notes and linking one needs to
  // know which two are missing rather than that something is.
  message(): string {
    return `this reply names ${this.uncited.join(', ')} without linking them; cite each as [[<path>|<name>]] so the reader can open it, and send the answer through answer_from_search`
  }
}
