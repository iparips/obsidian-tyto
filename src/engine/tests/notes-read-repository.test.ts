import { beforeEach, describe, expect, it } from 'vitest'
import { NotesReadRepository } from '../turn/notes-read-repository'

const TODO = 'Journal/Weekly/Week-36/todo.md'
const SHOPPING = 'Lists/shopping.md'

describe('NotesReadRepository', () => {
  let notesRead: NotesReadRepository

  beforeEach(() => {
    notesRead = new NotesReadRepository()
  })

  describe('when nothing has been read', () => {
    it('holds no note when nothing has been read', () => {
      expect(notesRead.includes(TODO)).toBe(false)
    })
  })

  describe('when a note has been read this turn', () => {
    beforeEach(() => {
      notesRead.record(TODO, '# Todo\n')
    })

    it('includes a note read this turn', () => {
      expect(notesRead.includes(TODO)).toBe(true)
    })

    it('excludes a note that was not read', () => {
      expect(notesRead.includes(SHOPPING)).toBe(false)
    })

    it('answers the contents that read returned', () => {
      expect(notesRead.getContentsRead(TODO)).toBe('# Todo\n')
    })
  })

  describe('when a note has been read twice this turn', () => {
    it('answers the later read, since a re-read is what a stale write is told to do', () => {
      notesRead.record(TODO, '# Todo\n')
      notesRead.record(TODO, '# Todo\n\n- [ ] eggs\n')

      expect(notesRead.getContentsRead(TODO)).toBe('# Todo\n\n- [ ] eggs\n')
    })
  })
})
