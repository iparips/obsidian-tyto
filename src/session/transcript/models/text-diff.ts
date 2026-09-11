// Lines the two texts share, in order, as pairs of indices. The classic
// longest-common-subsequence table: a note edited between steps differs by a
// line or two, so what is common is nearly all of it.
const commonLines = (before: readonly string[], after: readonly string[]): [number, number][] => {
  const lengths = lengthTable(before, after)
  const pairs: [number, number][] = []
  let row = 0
  let column = 0
  while (row < before.length && column < after.length) {
    if (before[row] === after[column]) pairs.push([row++, column++])
    else if (lengths[row + 1][column] >= lengths[row][column + 1]) row++
    else column++
  }
  return pairs
}

const lengthTable = (before: readonly string[], after: readonly string[]): number[][] => {
  const lengths = Array.from({ length: before.length + 1 }, () =>
    new Array(after.length + 1).fill(0),
  )
  for (let row = before.length - 1; row >= 0; row--)
    for (let column = after.length - 1; column >= 0; column--)
      lengths[row][column] =
        before[row] === after[column]
          ? lengths[row + 1][column + 1] + 1
          : Math.max(lengths[row + 1][column], lengths[row][column + 1])
  return lengths
}

// One text against the one before it, as the lines that changed. A note context
// is re-read from the editor every step, so a session that edits one line would
// otherwise write the whole note again under a new version.
export class TextDiff {
  private constructor(readonly lines: readonly string[]) {}

  static between(before: string, after: string): TextDiff {
    const from = before.split('\n')
    const to = after.split('\n')
    const lines: string[] = []
    let row = 0
    let column = 0
    commonLines(from, to).forEach(([atRow, atColumn]) => {
      while (row < atRow) lines.push(`- ${from[row++]}`)
      while (column < atColumn) lines.push(`+ ${to[column++]}`)
      lines.push(`  ${from[row++]}`)
      column++
    })
    while (row < from.length) lines.push(`- ${from[row++]}`)
    while (column < to.length) lines.push(`+ ${to[column++]}`)
    return new TextDiff(lines)
  }

  // Runs of unchanged lines collapse to a count, so a long note whose last line
  // moved does not print the whole note to say so.
  trimmed(context = 2): string[] {
    return this.lines.flatMap((line, at) => TextDiff.kept(this.lines, line, at, context))
  }

  private static kept(
    lines: readonly string[],
    line: string,
    at: number,
    context: number,
  ): string[] {
    if (line.startsWith('  ') === false) return [line]
    if (TextDiff.nearAChange(lines, at, context)) return [line]
    return TextDiff.opensARun(lines, at, context) ? ['  ...'] : []
  }

  private static nearAChange(lines: readonly string[], at: number, context: number): boolean {
    return lines
      .slice(Math.max(at - context, 0), at + context + 1)
      .some((line) => !line.startsWith('  '))
  }

  private static opensARun(lines: readonly string[], at: number, context: number): boolean {
    return at === 0 || TextDiff.nearAChange(lines, at - 1, context)
  }
}
