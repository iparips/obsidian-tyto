import { beforeEach, describe, expect, it } from 'vitest'
import { ChosenNotes } from '../models/chosen-notes'

const TODO = 'Journal/Weekly/Week-36/todo.md'
const SHOPPING = 'Lists/shopping.md'

describe('ChosenNotes', () => {
  let chosen: ChosenNotes

  beforeEach(() => {
    chosen = new ChosenNotes()
  })

  describe('when nothing has been chosen', () => {
    it('excludes every path when nothing has been chosen', () => {
      expect(chosen.includes(TODO)).toBe(false)
    })
  })

  describe('when the user has chosen a note', () => {
    beforeEach(() => {
      chosen.record(TODO)
    })

    it('includes a path the user chose', () => {
      expect(chosen.includes(TODO)).toBe(true)
    })

    it('excludes a path the user did not choose', () => {
      expect(chosen.includes(SHOPPING)).toBe(false)
    })
  })

  describe('when a second note is chosen', () => {
    beforeEach(() => {
      chosen.record(TODO)
      chosen.record(SHOPPING)
    })

    it('keeps a path from an earlier choice when a second is recorded', () => {
      expect(chosen.includes(TODO)).toBe(true)
    })
  })
})
