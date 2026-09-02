const SEPARATOR = '/'

// Obsidian paths are vault-relative with forward slashes, so the walk is a
// split rather than a filesystem operation and cannot escape the vault root.
export class AncestorFolders {
  static of(notePath: string): readonly string[] {
    const segments = notePath.split(SEPARATOR).slice(0, -1)
    return ['', ...AncestorFolders.prefixes(segments)]
  }

  private static prefixes(segments: readonly string[]): string[] {
    return segments
      .filter((segment) => segment !== '')
      .map((_, index, kept) => kept.slice(0, index + 1).join(SEPARATOR))
  }
}
