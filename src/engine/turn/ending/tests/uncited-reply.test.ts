import { describe, expect, it } from 'vitest'
import { UncitedReply } from '../uncited-reply'

const FOUND = '1 - Journal/Weekly/Week-35/04-09-Fri.md'

const uncitedIn = (reply: string, pathsFound: readonly string[] = [FOUND]): UncitedReply =>
  UncitedReply.inReply(reply, pathsFound)

describe('UncitedReply', () => {
  describe('when the reply names a path a search returned', () => {
    it('reads as uncited when the path is written as plain text', () => {
      expect(
        uncitedIn(`The note is 1 - Journal/Weekly/Week-35/04-09-Fri.md`).hasUncitedPaths(),
      ).toBe(true)
    })

    it('reads as uncited when the path sits in a fenced block rather than a link', () => {
      const reply = '```\n1 - Journal/Weekly/Week-35/04-09-Fri\n```'

      expect(uncitedIn(reply).hasUncitedPaths()).toBe(true)
    })

    it('reads as cited when the path is a wikilink carrying a name', () => {
      const reply = 'The note is [[1 - Journal/Weekly/Week-35/04-09-Fri|04-09-Fri]]'

      expect(uncitedIn(reply).hasUncitedPaths()).toBe(false)
    })

    it('reads as cited when the wikilink carries no name', () => {
      const reply = 'The note is [[1 - Journal/Weekly/Week-35/04-09-Fri]]'

      expect(uncitedIn(reply).hasUncitedPaths()).toBe(false)
    })

    it('reads as cited when the wikilink keeps the extension the path carries', () => {
      const reply = 'The note is [[1 - Journal/Weekly/Week-35/04-09-Fri.md]]'

      expect(uncitedIn(reply).hasUncitedPaths()).toBe(false)
    })
  })

  describe('when the reply does not name the path at all', () => {
    it('reads as cited, since a reply naming no note cites nothing', () => {
      expect(uncitedIn('Nothing in the vault covers that').hasUncitedPaths()).toBe(false)
    })
  })

  // A folder's own note is a prefix of every note beneath it, so a link to one
  // of those must not credit the containing note: the two are different notes
  // and only one was cited.
  describe('when one found path is a prefix of another', () => {
    it('credits only the path the link targets, so the containing note stays uncited', () => {
      const index = '2 - Projects/Dental/index.md'
      const nested = '2 - Projects/Dental/index/appointment.md'

      const message = uncitedIn('See [[2 - Projects/Dental/index/appointment]]', [
        index,
        nested,
      ]).message()

      expect(message).toContain(index)
      expect(message).not.toContain(nested)
    })
  })

  describe('when several found paths go uncited', () => {
    it('names each uncited path, so the model sees which are missing', () => {
      const other = '1 - Journal/Weekly/Week-35/03-09-Thu.md'

      const message = uncitedIn(
        '1 - Journal/Weekly/Week-35/04-09-Fri and 1 - Journal/Weekly/Week-35/03-09-Thu',
        [FOUND, other],
      ).message()

      expect(message).toContain('1 - Journal/Weekly/Week-35/04-09-Fri.md')
      expect(message).toContain('1 - Journal/Weekly/Week-35/03-09-Thu.md')
    })

    it('names the tool the answer should have gone through', () => {
      expect(uncitedIn('1 - Journal/Weekly/Week-35/04-09-Fri').message()).toContain(
        'answer_from_search',
      )
    })
  })
})
