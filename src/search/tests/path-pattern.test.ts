import { describe, expect, it } from 'vitest'
import { PathPattern } from '../models/path-pattern'

const FRIDAY = '1 - Journal/Weekly/Week-35/04-09-Fri.md'

const matches = (pattern: string, path: string): boolean =>
  PathPattern.compile(pattern).matches(path)

describe('PathPattern', () => {
  describe('when the pattern holds no wildcard', () => {
    it('matches the path when the pattern names it exactly', () => {
      expect(matches(FRIDAY, FRIDAY)).toBe(true)
    })

    it('misses the path when the pattern names another note', () => {
      expect(matches('1 - Journal/Weekly/Week-35/03-09-Thu.md', FRIDAY)).toBe(false)
    })
  })

  describe('when the pattern holds a star', () => {
    it('matches within one segment when the pattern has a star', () => {
      expect(matches('1 - Journal/Weekly/Week-35/*.md', FRIDAY)).toBe(true)
    })

    it('crosses no separator on a star, so a nested note is missed', () => {
      expect(matches('1 - Journal/Weekly/*.md', FRIDAY)).toBe(false)
    })
  })

  describe('when the pattern holds a double star', () => {
    it('crosses separators on a double star', () => {
      expect(matches('**/Week-35/*.md', FRIDAY)).toBe(true)
    })

    it('matches a note at the vault root, so a leading double star may match no folder', () => {
      expect(matches('**/*.md', 'inbox.md')).toBe(true)
    })
  })

  describe('when the pattern holds a question mark', () => {
    it('matches one character on a question mark', () => {
      expect(matches('1 - Journal/Weekly/Week-3?/04-09-Fri.md', FRIDAY)).toBe(true)
    })

    it('matches no separator on a question mark', () => {
      expect(matches('1 - Journal/Weekly?Week-35/04-09-Fri.md', FRIDAY)).toBe(false)
    })
  })

  describe('when the case differs', () => {
    it('matches whatever the case, so a recalled lower-case folder still finds it', () => {
      expect(matches('**/week-35/*.md', FRIDAY)).toBe(true)
    })
  })

  describe('when a folder name holds regular-expression characters', () => {
    it('escapes a regular-expression character, so a bracketed folder matches literally', () => {
      expect(matches('Notes (old)/*.md', 'Notes (old)/kept.md')).toBe(true)
    })

    it('treats a regular-expression character as itself, so it matches no other character', () => {
      expect(matches('Notes (old)/*.md', 'Notes xoldx/kept.md')).toBe(false)
    })

    it('matches a folder name holding spaces and hyphens, as a real vault has', () => {
      expect(matches('1 - Journal/**', FRIDAY)).toBe(true)
    })
  })

  describe('when the pattern is anchored', () => {
    it('matches no note mid-path, so a bare folder pattern does not reach a nested note', () => {
      expect(matches('Week-35/*.md', FRIDAY)).toBe(false)
    })

    it('matches the extension too, so a pattern ending in a star still matches a note', () => {
      expect(matches('1 - Journal/Weekly/Week-35/*', FRIDAY)).toBe(true)
    })
  })
})
