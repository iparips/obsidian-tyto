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
      notesRead.record(TODO)
    })

    it('includes a note read this turn', () => {
      expect(notesRead.includes(TODO)).toBe(true)
    })

    it('excludes a note that was not read', () => {
      expect(notesRead.includes(SHOPPING)).toBe(false)
    })
  })
})
