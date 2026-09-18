import { describe, expect, it } from 'vitest'
import { ProgressLine } from '../progress-line'

describe('ProgressLine', () => {
  describe('when a search is recorded', () => {
    it('names the query and how many matched when hits come back', () => {
      expect(ProgressLine.searched('milk', 3).detail).toBe('milk — 3 matches')
    })

    it('uses the singular when one note matched', () => {
      expect(ProgressLine.searched('milk', 1).detail).toBe('milk — 1 match')
    })

    it('says nothing matched when the search found none', () => {
      expect(ProgressLine.searched('milk', 0).detail).toBe('milk — nothing matched')
    })

    it('labels it as a search', () => {
      expect(ProgressLine.searched('milk', 3).label).toBe('Searched')
    })
  })

  describe('when a glob is recorded', () => {
    it('names the pattern and how many matched when notes come back', () => {
      expect(ProgressLine.globbed('Week-35/*.md', 3).detail).toBe('Week-35/*.md — 3 notes')
    })

    it('uses the singular when one note matched', () => {
      expect(ProgressLine.globbed('Week-35/*.md', 1).detail).toBe('Week-35/*.md — 1 note')
    })

    it('says nothing matched when the glob found none', () => {
      expect(ProgressLine.globbed('Week-35/*.md', 0).detail).toBe('Week-35/*.md — nothing matched')
    })

    it('labels it as a glob, so a listing reads apart from a search', () => {
      expect(ProgressLine.globbed('Week-35/*.md', 3).label).toBe('Globbed')
    })
  })

  describe('when a grep is recorded', () => {
    it('names the expression and how many matched when notes come back', () => {
      expect(ProgressLine.grepped('roofing', 'the whole vault', 2).detail).toBe(
        'roofing in the whole vault — 2 notes',
      )
    })

    // A narrowed grep finding nothing is a fact about the narrowing, and a line
    // that omits it reads as a fact about the vault.
    it('names the folder it searched when the grep was narrowed to one', () => {
      expect(ProgressLine.grepped('roofing', '1 - Journal/*', 0).detail).toBe(
        'roofing in 1 - Journal/* — nothing matched',
      )
    })

    it('labels it as a grep', () => {
      expect(ProgressLine.grepped('roofing', 'the whole vault', 2).label).toBe('Grepped')
    })
  })

  describe('when a note is reached', () => {
    it('holds the note apart from the detail when a note is read', () => {
      expect(ProgressLine.read('Lists/todo.md').note).toBe('Lists/todo.md')
    })

    it('leaves the path out of the detail text, since the note is a field now', () => {
      expect(ProgressLine.read('Lists/todo.md').detail).toBe('')
    })

    it('holds the note when a note is opened', () => {
      expect(ProgressLine.opened('Lists/todo.md').note).toBe('Lists/todo.md')
    })

    it('names the path when a note is opened', () => {
      expect(ProgressLine.opened('Lists/todo.md').label).toBe('Opened')
    })
  })

  describe('when a line touched no note', () => {
    it('holds no note, so nothing can differ from the target', () => {
      expect(ProgressLine.globbed('Lists/*', 2).note).toBeNull()
    })
  })

  describe('when an edit lands', () => {
    it('holds the note the edit reached apart from the result', () => {
      expect(ProgressLine.edited('applied', 'Lists/todo.md').note).toBe('Lists/todo.md')
    })

    it('leaves the path out of the detail text, since the note is a field now', () => {
      expect(ProgressLine.edited('applied', 'Lists/todo.md').detail).toBe('applied')
    })

    it('holds no note when the turn has no target to name', () => {
      expect(ProgressLine.edited('applied', null).note).toBeNull()
    })

    it('labels it as an edit', () => {
      expect(ProgressLine.edited('applied', 'Lists/todo.md').label).toBe('Edit')
    })
  })

  describe('when the turn refuses a call', () => {
    it('marks a refusal as refused, so the panel can set it apart', () => {
      expect(ProgressLine.refused('open_note', 'the path was never searched').refused).toBe(true)
    })

    // Three refusals in one turn read as one repeated failure unless the label
    // says which call each of them stopped.
    it('names the refused tool in the label', () => {
      expect(ProgressLine.refused('open_note', 'the path was never searched').label).toBe(
        'Refused open_note',
      )
    })

    it('names the tool on a refusal built without one, once the dispatcher supplies it', () => {
      expect(ProgressLine.refusedByUnnamedTool('search is off').byTool('glob_notes')).toMatchObject(
        {
          label: 'Refused glob_notes',
          detail: 'search is off',
          refused: true,
        },
      )
    })

    it('leaves a search unmarked, so only refusals stand out', () => {
      expect(ProgressLine.searched('milk', 3).refused).toBe(false)
    })
  })
})
