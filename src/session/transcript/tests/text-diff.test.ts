import { describe, expect, it } from 'vitest'
import { TextDiff } from '../models/text-diff'

// A note context is re-read from the editor every step, so a session that edits
// one line would otherwise write the whole note again under a new version.
describe('TextDiff', () => {
  const diffOf = (before: string, after: string, context?: number) =>
    TextDiff.between(before, after).trimmed(context)

  describe('when a line changes', () => {
    it('marks the line that went and the line that came', () => {
      expect(diffOf('a\nb\nc', 'a\nB\nc')).toEqual(['  a', '- b', '+ B', '  c'])
    })

    it('marks an added line without marking anything removed', () => {
      expect(diffOf('a\nb', 'a\nb\nc')).toEqual(['  a', '  b', '+ c'])
    })

    it('marks a removed line without marking anything added', () => {
      expect(diffOf('a\nb\nc', 'a\nc')).toEqual(['  a', '- b', '  c'])
    })
  })

  describe('when the texts are the same', () => {
    it('collapses the whole thing, since nothing changed', () => {
      expect(diffOf('a\nb\nc', 'a\nb\nc')).toEqual(['  ...'])
    })
  })

  describe('when a long run is unchanged', () => {
    const longNote = (last: string) =>
      ['# Note', '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', last].join('\n')

    it('collapses the run to an ellipsis rather than printing the note again', () => {
      const diff = diffOf(longNote('eight'), longNote('nine'), 1)

      expect(diff).toEqual(['  ...', '  seven', '- eight', '+ nine'])
    })

    it('keeps the lines either side of a change, so it reads in place', () => {
      const diff = diffOf(longNote('eight'), longNote('nine'), 2)

      expect(diff).toEqual(['  ...', '  six', '  seven', '- eight', '+ nine'])
    })
  })

  // The cases above name the shapes worth reading. This one says the diff is a
  // diff at all: a wrong common subsequence is a transcript that misreports
  // what the user's note said, and the examples alone would not catch it.
  // Seeded, so a failure names the pair that caused it rather than flaking.
  describe('over many generated pairs', () => {
    const linesOf = (diff: readonly string[], skip: string) =>
      diff.filter((line) => !line.startsWith(skip)).map((line) => line.slice(2))

    it('reproduces both texts, so nothing is invented and nothing is lost', () => {
      const random = seededRandom(20260911)
      const someLines = () =>
        Array.from({ length: 1 + Math.floor(random() * 8) }, () =>
          String.fromCharCode(97 + Math.floor(random() * 5)),
        )

      for (let pair = 0; pair < 500; pair++) {
        const before = someLines()
        const after = someLines()

        const diff = TextDiff.between(before.join('\n'), after.join('\n')).lines

        expect({ pair, lines: linesOf(diff, '- ') }).toEqual({ pair, lines: after })
        expect({ pair, lines: linesOf(diff, '+ ') }).toEqual({ pair, lines: before })
      }
    })

    // Round-tripping alone would pass a diff that marks every line changed, so
    // the count of kept lines is asserted against the true longest common
    // subsequence. This is what makes it a diff rather than a rewrite.
    it('keeps as many lines as the texts genuinely share', () => {
      const random = seededRandom(20260912)
      const someLines = () =>
        Array.from({ length: 1 + Math.floor(random() * 8) }, () =>
          String.fromCharCode(97 + Math.floor(random() * 4)),
        )

      for (let pair = 0; pair < 500; pair++) {
        const before = someLines()
        const after = someLines()

        const diff = TextDiff.between(before.join('\n'), after.join('\n')).lines

        const unchanged = diff.filter((line) => line.startsWith('  ')).length
        expect({ pair, unchanged }).toEqual({ pair, unchanged: longestCommon(before, after) })
      }
    })
  })
})

// The plain recursive definition, memoised only by the table it fills. Slow and
// obviously right, which is what a test needs: the code under test is the fast
// version, and this is the answer it has to match.
const longestCommon = (before: readonly string[], after: readonly string[]): number => {
  const lengths = Array.from({ length: before.length + 1 }, () =>
    new Array<number>(after.length + 1).fill(0),
  )
  for (let row = before.length - 1; row >= 0; row--)
    for (let column = after.length - 1; column >= 0; column--)
      lengths[row][column] =
        before[row] === after[column]
          ? lengths[row + 1][column + 1] + 1
          : Math.max(lengths[row + 1][column], lengths[row][column + 1])
  return lengths[0][0]
}

// A generator of its own, so the pairs are the same on every run and a failure
// is reproducible. Mulberry32: small, and random enough for line labels.
const seededRandom = (seed: number): (() => number) => {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let drawn = Math.imul(state ^ (state >>> 15), 1 | state)
    drawn = (drawn + Math.imul(drawn ^ (drawn >>> 7), 61 | drawn)) ^ drawn
    return ((drawn ^ (drawn >>> 14)) >>> 0) / 4294967296
  }
}
