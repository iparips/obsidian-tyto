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

  // A shell glob supports these, so a model that writes Week-3[5-8] is writing
  // correct glob rather than inventing syntax. Matching them literally cost a
  // real turn six calls that each returned nothing.
  describe('when the pattern holds a character class', () => {
    it('matches a digit in the range, so one pattern reaches several week folders', () => {
      expect(matches('**/Week-3[4-6]/*.md', FRIDAY)).toBe(true)
    })

    it('misses a digit outside the range', () => {
      expect(matches('**/Week-3[6-8]/*.md', FRIDAY)).toBe(false)
    })

    it('matches a listed character as well as a range', () => {
      expect(matches('**/Week-3[135]/*.md', FRIDAY)).toBe(true)
    })

    it('takes two classes in one segment', () => {
      expect(matches('**/Week-[0-9][0-9]/*.md', FRIDAY)).toBe(true)
    })

    it('negates on a leading bang, as a shell glob does', () => {
      expect(matches('**/Week-3[!5]/*.md', FRIDAY)).toBe(false)
    })

    it('crosses no separator inside a class, since no wildcard here does', () => {
      expect(matches('1 - Journal[/]Weekly/Week-35/*.md', FRIDAY)).toBe(false)
    })

    // The class is the wildcard now, so a folder actually named with brackets
    // is the case that no longer matches literally. Same as a shell.
    it('reads a bracketed folder name as a class rather than as its own name', () => {
      expect(matches('Notes [old]/*.md', 'Notes [old]/kept.md')).toBe(false)
    })

    it('matches an unclosed bracket literally, so a stray one is a folder name', () => {
      expect(matches('**/Week-3[5-8/*', 'x/Week-3[5-8/todo.md')).toBe(true)
    })

    it('matches a lone closing bracket literally', () => {
      expect(matches('**/a]b/*', 'x/a]b/todo.md')).toBe(true)
    })
  })

  // A shell supports these, so a model writing them is writing correct glob.
  // Each was previously matched literally, which could only miss.
  describe('when the pattern holds a brace list', () => {
    it('matches either alternative, so one call covers two week folders', () => {
      expect(matches('**/{Week-35,Week-36}/*.md', FRIDAY)).toBe(true)
    })

    it('misses a note in neither alternative', () => {
      expect(matches('**/{Week-33,Week-34}/*.md', FRIDAY)).toBe(false)
    })

    it('expands a brace list mid-name, so Week-3{5,6} needs no folder repeated', () => {
      expect(matches('**/Week-3{5,6}/*.md', FRIDAY)).toBe(true)
    })

    it('matches either extension, so one call covers a note and a canvas', () => {
      expect(matches('**/*.{md,canvas}', FRIDAY)).toBe(true)
    })

    it('expands a numeric range, as a shell does', () => {
      expect(matches('**/Week-{30..40}/*.md', FRIDAY)).toBe(true)
    })
  })

  describe('when the pattern holds an extglob', () => {
    it('matches one of the listed alternatives on an at sign', () => {
      expect(matches('**/@(Week-35|Week-36)/*.md', FRIDAY)).toBe(true)
    })

    it('repeats a class on a plus, so Week-+([0-9]) covers any week number', () => {
      expect(matches('**/Week-+([0-9])/*.md', FRIDAY)).toBe(true)
    })

    it('excludes the listed alternative on a bang', () => {
      expect(matches('**/!(Week-35)/*.md', FRIDAY)).toBe(false)
    })

    it('admits a folder the bang did not name', () => {
      expect(matches('**/!(Week-36)/*.md', FRIDAY)).toBe(true)
    })

    it('matches the alternative when present on a question mark', () => {
      expect(matches('**/Week-35/?(04)-09-Fri.md', FRIDAY)).toBe(true)
    })

    it('matches nothing at all on a question mark, so the group is optional', () => {
      expect(matches('**/Week-35/?(x)04-09-Fri.md', FRIDAY)).toBe(true)
    })

    it('crosses no separator inside an extglob, since no wildcard here does', () => {
      expect(matches('1 - Journal/?(Weekly/)Week-35/*.md', FRIDAY)).toBe(false)
    })
  })

  // The pattern comes from the model, so one that will not compile must be an
  // empty result rather than a thrown error (NFR5).
  describe('when the pattern cannot compile', () => {
    it('matches nothing rather than throwing, as a POSIX class does not compile', () => {
      expect(matches('**/Week-[[:digit:]][[:digit:]]/*.md', FRIDAY)).toBe(false)
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
