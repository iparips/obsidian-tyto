import { describe, expect, it } from 'vitest'
import { AnswerSources } from '../answer-sources'

const namesIn = (sources: string[], group = 0): string[] =>
  AnswerSources.grouped(sources)[group].notes.map((note) => note.name)

describe('AnswerSources', () => {
  describe('when several notes share a folder', () => {
    it('holds the folder once, with every name it carries', () => {
      const grouped = AnswerSources.grouped([
        '4 - Archive/2026/Q3/Week-36/09-04-Fri.md',
        '4 - Archive/2026/Q3/Week-36/09-05-Sat.md',
      ])

      expect(grouped).toEqual([
        {
          folder: '4 - Archive/2026/Q3/Week-36',
          notes: [
            { name: '09-04-Fri', path: '4 - Archive/2026/Q3/Week-36/09-04-Fri.md' },
            { name: '09-05-Sat', path: '4 - Archive/2026/Q3/Week-36/09-05-Sat.md' },
          ],
        },
      ])
    })

    // The answer cited them in an order, and sorting would present a different
    // one as though the answer had used it.
    it('keeps the order the answer cited them in', () => {
      const grouped = AnswerSources.grouped(['B/one.md', 'A/two.md'])

      expect(grouped.map((group) => group.folder)).toEqual(['B', 'A'])
    })

    it('groups a folder revisited later with its earlier notes', () => {
      const grouped = AnswerSources.grouped(['A/one.md', 'B/two.md', 'A/three.md'])

      expect(grouped.map((group) => group.folder)).toEqual(['A', 'B'])
      expect(namesIn(['A/one.md', 'B/two.md', 'A/three.md'])).toEqual(['one', 'three'])
    })
  })

  describe('when a name is read off a path', () => {
    it('drops the extension, since every source is a note', () => {
      expect(namesIn(['A/one.md'])).toEqual(['one'])
    })

    it('keeps a name that does not end in the extension', () => {
      expect(namesIn(['A/README'])).toEqual(['README'])
    })

    // The name is what the user reads; opening one needs the path the search
    // returned, extension and all.
    it('keeps the whole path beside the name, so the note can be opened', () => {
      expect(AnswerSources.grouped(['A/one.md'])[0].notes[0].path).toBe('A/one.md')
    })
  })

  describe('when a note sits at the vault root', () => {
    it('names the root rather than leaving the folder empty', () => {
      expect(AnswerSources.grouped(['inbox.md'])).toEqual([
        { folder: 'the vault root', notes: [{ name: 'inbox', path: 'inbox.md' }] },
      ])
    })
  })

  describe('when the answer cited nothing', () => {
    it('groups none', () => {
      expect(AnswerSources.grouped([])).toEqual([])
    })
  })
})
