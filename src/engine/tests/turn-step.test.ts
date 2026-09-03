import { describe, expect, it } from 'vitest'
import { TurnStep } from '../models/turn-step'

describe('TurnStep', () => {
  describe('when a search is recorded', () => {
    it('names the query and how many matched when hits come back', () => {
      expect(TurnStep.searched('milk', 3).detail).toBe('milk — 3 matches')
    })

    it('uses the singular when one note matched', () => {
      expect(TurnStep.searched('milk', 1).detail).toBe('milk — 1 match')
    })

    it('says nothing matched when the search found none', () => {
      expect(TurnStep.searched('milk', 0).detail).toBe('milk — nothing matched')
    })

    it('labels it as a search', () => {
      expect(TurnStep.searched('milk', 3).label).toBe('Searched')
    })
  })

  describe('when a glob is recorded', () => {
    it('names the pattern and how many matched when notes come back', () => {
      expect(TurnStep.globbed('Week-35/*.md', 3).detail).toBe('Week-35/*.md — 3 notes')
    })

    it('uses the singular when one note matched', () => {
      expect(TurnStep.globbed('Week-35/*.md', 1).detail).toBe('Week-35/*.md — 1 note')
    })

    it('says nothing matched when the glob found none', () => {
      expect(TurnStep.globbed('Week-35/*.md', 0).detail).toBe('Week-35/*.md — nothing matched')
    })

    it('labels it as a glob, so a listing reads apart from a search', () => {
      expect(TurnStep.globbed('Week-35/*.md', 3).label).toBe('Globbed')
    })
  })

  describe('when a grep is recorded', () => {
    it('names the expression and how many matched when notes come back', () => {
      expect(TurnStep.grepped('roofing', 2).detail).toBe('roofing — 2 notes')
    })

    it('labels it as a grep', () => {
      expect(TurnStep.grepped('roofing', 2).label).toBe('Grepped')
    })
  })

  describe('when a note is reached', () => {
    it('names the path when a note is read', () => {
      expect(TurnStep.read('Lists/todo.md').detail).toBe('Lists/todo.md')
    })

    it('names the path when a note is opened', () => {
      expect(TurnStep.opened('Lists/todo.md').label).toBe('Opened')
    })
  })

  describe('when the turn refuses a call', () => {
    it('marks a refusal as refused, so the panel can set it apart', () => {
      expect(TurnStep.refused('the path was never searched').refused).toBe(true)
    })

    it('leaves a search unmarked, so only refusals stand out', () => {
      expect(TurnStep.searched('milk', 3).refused).toBe(false)
    })
  })
})
