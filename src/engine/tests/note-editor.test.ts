import { describe, expect, it } from 'vitest'
import { NoteEditor } from '../note-editor'
import { NoteContext } from '../models/note-context'
import { FakeEditor } from '../../test-support/fake-editor'

const noteEditor = new NoteEditor()

const applyTo = (editor: FakeEditor, op: Parameters<NoteEditor['apply']>[2]) =>
  noteEditor.apply(
    editor.asEditor(),
    new NoteContext('note.md', editor.getValue(), editor.getCursor()),
    op,
  )

describe('NoteEditor', () => {
  describe('when replacing', () => {
    it('applies replacement when the anchor matches exactly once', () => {
      const editor = new FakeEditor('# Budget\n\ntext')

      const result = applyTo(editor, {
        kind: 'replace',
        anchor: '# Budget',
        replacement: '# Costs',
      })

      expect(result.applied).toBe(true)
      expect(editor.content).toBe('# Costs\n\ntext')
    })

    it('returns noMatch when the anchor is absent', () => {
      const editor = new FakeEditor('# Budget')

      const result = applyTo(editor, {
        kind: 'replace',
        anchor: '# Missing',
        replacement: 'x',
      })

      expect(result).toEqual({ applied: false, reason: 'noMatch' })
    })

    it('returns multipleMatches when the anchor appears twice', () => {
      const editor = new FakeEditor('item\nitem')

      const result = applyTo(editor, { kind: 'replace', anchor: 'item', replacement: 'x' })

      expect(result).toEqual({ applied: false, reason: 'multipleMatches' })
    })

    it('preserves surrounding content when applying in the middle of a line', () => {
      const editor = new FakeEditor('the quick brown fox')

      applyTo(editor, { kind: 'replace', anchor: 'quick', replacement: 'slow' })

      expect(editor.content).toBe('the slow brown fox')
    })
  })

  describe('when inserting at an anchor', () => {
    it('inserts before the anchor when position is before', () => {
      const editor = new FakeEditor('## Heading\nbody')

      applyTo(editor, {
        kind: 'insert',
        anchor: 'body',
        position: 'before',
        content: 'intro\n',
      })

      expect(editor.content).toBe('## Heading\nintro\nbody')
    })

    it('inserts after the anchor when position is after', () => {
      const editor = new FakeEditor('## Heading\nbody')

      applyTo(editor, {
        kind: 'insert',
        anchor: '## Heading',
        position: 'after',
        content: '\nintro',
      })

      expect(editor.content).toBe('## Heading\nintro\nbody')
    })
  })

  describe('when inserting at a location', () => {
    it('inserts at note start when location is noteStart', () => {
      const editor = new FakeEditor('body')

      applyTo(editor, { kind: 'insertAt', location: 'noteStart', content: 'top\n' })

      expect(editor.content).toBe('top\nbody')
    })

    it('inserts at note end when location is noteEnd', () => {
      const editor = new FakeEditor('body')

      applyTo(editor, { kind: 'insertAt', location: 'noteEnd', content: '\nbottom' })

      expect(editor.content).toBe('body\nbottom')
    })

    it('inserts at the captured cursor when location is cursor', () => {
      const editor = new FakeEditor('line one\nline two')
      editor.cursor = { line: 1, ch: 0 }

      applyTo(editor, { kind: 'insertAt', location: 'cursor', content: 'here ' })

      expect(editor.content).toBe('line one\nhere line two')
    })
  })
  describe('when reporting where an edit ended', () => {
    it('reports the end of the replacement when a replace applies', () => {
      const editor = new FakeEditor('# Budget\n\ntext')

      const result = applyTo(editor, {
        kind: 'replace',
        anchor: '# Budget',
        replacement: '# Costs',
      })

      expect(result).toEqual({ applied: true, endedAt: { line: 0, ch: 7 } })
    })

    it('reports the end of the inserted content when an insert applies', () => {
      const editor = new FakeEditor('# Budget\n\ntext')

      const result = applyTo(editor, { kind: 'insertAt', location: 'noteEnd', content: '!' })

      expect(result).toEqual({ applied: true, endedAt: { line: 2, ch: 5 } })
    })
  })

  describe('when focusing an edit', () => {
    it('moves the cursor to the given position', () => {
      const editor = new FakeEditor('# Costs\n\ntext')

      noteEditor.focusEdit(editor.asEditor(), { line: 0, ch: 7 })

      expect(editor.cursor).toEqual({ line: 0, ch: 7 })
    })

    it('scrolls the given position into view', () => {
      const editor = new FakeEditor('# Costs\n\ntext')

      noteEditor.focusEdit(editor.asEditor(), { line: 0, ch: 7 })

      expect(editor.scrolledTo).toEqual({ line: 0, ch: 7 })
    })
  })
})
