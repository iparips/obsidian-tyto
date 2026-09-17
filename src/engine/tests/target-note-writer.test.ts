import { describe, expect, it } from 'vitest'
import { NoteDetails } from '../note-editing/note-details'
import { NoteEditor } from '../note-editing/note-editor'
import { OpenNote } from '../note-editing/open-note'
import { TargetNoteWriter } from '../note-editing/target-note-writer'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { FakeVault } from '../../test-support/fake-vault'

const TARGET = 'shopping-list.md'

const aTarget = (editor: FakeEditor): OpenNote =>
  new OpenNote(editor.asEditor(), TARGET, editor.getCursor())

const aWriter = (locator: FakeNoteLocator, vault: FakeVault): TargetNoteWriter =>
  new TargetNoteWriter(new NoteEditor(), locator, vault.asVault())

describe('TargetNoteWriter', () => {
  describe('when the tab still shows the target', () => {
    it('writes through the editor', async () => {
      const editor = new FakeEditor('- milk')
      const writer = aWriter(new FakeNoteLocator().withOpenNote(TARGET, editor), new FakeVault())

      await writer.write(aTarget(editor), {
        kind: 'insertAt',
        location: 'noteEnd',
        content: '\n- eggs',
      })

      expect(editor.content).toBe('- milk\n- eggs')
    })

    it('reports where the edit ended, so the turn can focus it', async () => {
      const editor = new FakeEditor('- milk')
      const writer = aWriter(new FakeNoteLocator().withOpenNote(TARGET, editor), new FakeVault())

      const result = await writer.write(aTarget(editor), {
        kind: 'insertAt',
        location: 'noteEnd',
        content: '\n- eggs',
      })

      expect(result).toEqual({ applied: true, endedAt: { line: 1, ch: 6 } })
    })

    it('refuses an anchor the note does not hold', async () => {
      const editor = new FakeEditor('- milk')
      const writer = aWriter(new FakeNoteLocator().withOpenNote(TARGET, editor), new FakeVault())

      const result = await writer.write(aTarget(editor), {
        kind: 'replace',
        anchor: '- bread',
        replacement: '- eggs',
      })

      expect(result).toEqual({ applied: false, reason: 'noMatch' })
    })
  })

  // The reported defect: the handle the turn holds now shows another note, and
  // the write followed it.
  describe('when the tab has moved to another note', () => {
    const movedTab = (): { target: OpenNote; nowShown: FakeEditor; vault: FakeVault } => {
      const target = aTarget(new FakeEditor('- milk'))
      const nowShown = new FakeEditor('# Todo')
      return {
        target,
        nowShown,
        vault: new FakeVault().withNote(TARGET, '- milk').withNote('todo.md', '# Todo'),
      }
    }

    it('writes the target through the vault', async () => {
      const { target, nowShown, vault } = movedTab()
      const writer = aWriter(new FakeNoteLocator().withOpenNote('todo.md', nowShown), vault)

      await writer.write(target, { kind: 'insertAt', location: 'noteEnd', content: '\n- eggs' })

      expect(vault.contentOf(TARGET)).toBe('- milk\n- eggs')
    })

    it('leaves the note the tab now shows untouched', async () => {
      const { target, nowShown, vault } = movedTab()
      const writer = aWriter(new FakeNoteLocator().withOpenNote('todo.md', nowShown), vault)

      await writer.write(target, { kind: 'insertAt', location: 'noteEnd', content: '\n- eggs' })

      expect(nowShown.content).toBe('# Todo')
    })

    it('does not move the cursor, since the target is not on screen', async () => {
      const { target, nowShown, vault } = movedTab()
      const writer = aWriter(new FakeNoteLocator().withOpenNote('todo.md', nowShown), vault)

      await writer.write(target, { kind: 'insertAt', location: 'noteEnd', content: '\n- eggs' })

      expect(nowShown.cursor).toEqual({ line: 0, ch: 0 })
    })

    it('refuses an anchor the file does not hold', async () => {
      const { target, nowShown, vault } = movedTab()
      const writer = aWriter(new FakeNoteLocator().withOpenNote('todo.md', nowShown), vault)

      const result = await writer.write(target, {
        kind: 'replace',
        anchor: '- bread',
        replacement: '- eggs',
      })

      expect(result).toEqual({ applied: false, reason: 'noMatch' })
    })

    it('leaves the target unchanged when the anchor does not match', async () => {
      const { target, nowShown, vault } = movedTab()
      const writer = aWriter(new FakeNoteLocator().withOpenNote('todo.md', nowShown), vault)

      await writer.write(target, { kind: 'replace', anchor: '- bread', replacement: '- eggs' })

      expect(vault.contentOf(TARGET)).toBe('- milk')
    })
  })

  describe('when the target has no editor at all', () => {
    it('writes through the vault', async () => {
      const target = aTarget(new FakeEditor('- milk'))
      const vault = new FakeVault().withNote(TARGET, '- milk')
      const writer = aWriter(new FakeNoteLocator(), vault)

      await writer.write(target, { kind: 'insertAt', location: 'noteEnd', content: '\n- eggs' })

      expect(vault.contentOf(TARGET)).toBe('- milk\n- eggs')
    })

    it('refuses when the vault has no note at the path', async () => {
      const target = aTarget(new FakeEditor('- milk'))
      const writer = aWriter(new FakeNoteLocator(), new FakeVault())

      const result = await writer.write(target, {
        kind: 'insertAt',
        location: 'noteEnd',
        content: '\n- eggs',
      })

      expect(result).toEqual({ applied: false, reason: 'noMatch' })
    })
  })

  describe('when focusing the edit at the end of a turn', () => {
    it('moves the cursor while the tab still shows the target', () => {
      const editor = new FakeEditor('- milk\n- eggs')
      const writer = aWriter(new FakeNoteLocator().withOpenNote(TARGET, editor), new FakeVault())

      writer.focusEdit(aTarget(editor), { line: 1, ch: 6 })

      expect(editor.cursor).toEqual({ line: 1, ch: 6 })
    })

    it('leaves the cursor alone once the tab has moved', () => {
      const target = aTarget(new FakeEditor('- milk'))
      const nowShown = new FakeEditor('# Todo')
      const writer = aWriter(
        new FakeNoteLocator().withOpenNote('todo.md', nowShown),
        new FakeVault(),
      )

      writer.focusEdit(target, { line: 1, ch: 6 })

      expect(nowShown.cursor).toEqual({ line: 0, ch: 0 })
    })
  })

  describe('when reading the target', () => {
    it('reads the editor while the tab still shows it', async () => {
      const editor = new FakeEditor('- milk, unsaved')
      const writer = aWriter(
        new FakeNoteLocator().withOpenNote(TARGET, editor),
        new FakeVault().withNote(TARGET, '- milk'),
      )

      expect(await writer.read(aTarget(editor))).toBe('- milk, unsaved')
    })

    it('reads the file once the tab has moved', async () => {
      const { target, nowShown, vault } = {
        target: aTarget(new FakeEditor('- milk, unsaved')),
        nowShown: new FakeEditor('# Todo'),
        vault: new FakeVault().withNote(TARGET, '- milk'),
      }
      const writer = aWriter(new FakeNoteLocator().withOpenNote('todo.md', nowShown), vault)

      expect(await writer.read(target)).toBe('- milk')
    })
  })

  // What the model is shown. The path and the content have to come from the
  // same note, which is what a tab that moved broke.
  describe('when describing the target for the model', () => {
    it('describes the editor while the tab still shows it', async () => {
      const editor = new FakeEditor('- milk, unsaved')
      const writer = aWriter(
        new FakeNoteLocator().withOpenNote(TARGET, editor),
        new FakeVault().withNote(TARGET, '- milk'),
      )

      expect(await writer.getDetails(aTarget(editor))).toEqual(
        new NoteDetails(TARGET, '- milk, unsaved', { line: 0, ch: 0 }),
      )
    })

    it('describes the file once the tab has moved', async () => {
      const target = aTarget(new FakeEditor('- milk'))
      const nowShown = new FakeEditor('# Todo')
      const writer = aWriter(
        new FakeNoteLocator().withOpenNote('todo.md', nowShown),
        new FakeVault().withNote(TARGET, '- milk, saved'),
      )

      expect(await writer.getDetails(target)).toEqual(
        new NoteDetails(TARGET, '- milk, saved', { line: 0, ch: 0 }),
      )
    })
  })
})
