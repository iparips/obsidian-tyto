import { describe, expect, it } from 'vitest'
import { NoteDetails } from '../note-editing/note-details'
import { NoteEditor } from '../note-editing/note-editor'
import { OpenNote } from '../note-editing/open-note'
import { TargetNoteWriter } from '../note-editing/target-note-writer'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { FakeVault } from '../../test-support/fake-vault'
import { FakeWorkspace } from '../../test-support/fake-workspace'

const TARGET = 'shopping-list.md'

const aTarget = (editor: FakeEditor): OpenNote =>
  new OpenNote(editor.asEditor(), TARGET, editor.getCursor())

const aWriter = (
  locator: FakeNoteLocator,
  vault: FakeVault,
  workspace = new FakeWorkspace(),
): TargetNoteWriter =>
  new TargetNoteWriter(new NoteEditor(), locator, vault.asVault(), workspace.asWorkspace())

// A view that finished loading: the editor holds the target, and so does the
// file. The text is the editor's, so a test that asserts on it still says it.
const aLoadedWriter = (editor: FakeEditor): TargetNoteWriter =>
  aWriter(
    new FakeNoteLocator().withOpenNote(TARGET, editor),
    new FakeVault().withNote(TARGET, editor.getValue()),
  )

// The reported session: the locator answers with the turn's own handle for the
// target's path, and the file under that path says something else. The view has
// been pointed at the target and its editor still holds the previous note.
const halfOpened = (): { target: OpenNote; stale: FakeEditor; vault: FakeVault } => {
  const stale = new FakeEditor('# Session transcript')
  return {
    target: aTarget(stale),
    stale,
    vault: new FakeVault().withNote(TARGET, '- milk'),
  }
}

const aHalfOpenedWriter = (stale: FakeEditor, vault: FakeVault): TargetNoteWriter =>
  aWriter(new FakeNoteLocator().withOpenNote(TARGET, stale), vault)

describe('TargetNoteWriter', () => {
  describe('when the tab still shows the target', () => {
    it('writes through the editor', async () => {
      const editor = new FakeEditor('- milk')
      const writer = aLoadedWriter(editor)

      await writer.write(aTarget(editor), {
        kind: 'insertAt',
        location: 'noteEnd',
        content: '\n- eggs',
      })

      expect(editor.content).toBe('- milk\n- eggs')
    })

    it('reports where the edit ended, so the turn can focus it', async () => {
      const editor = new FakeEditor('- milk')
      const writer = aLoadedWriter(editor)

      const result = await writer.write(aTarget(editor), {
        kind: 'insertAt',
        location: 'noteEnd',
        content: '\n- eggs',
      })

      expect(result).toEqual({ applied: true, endedAt: { line: 1, ch: 6 }, wroteThrough: 'editor' })
    })

    it('refuses an anchor the note does not hold', async () => {
      const editor = new FakeEditor('- milk')
      const writer = aLoadedWriter(editor)

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

    // What the panel warns on: this is the path that costs the cursor.
    it('reports the write went through the vault', async () => {
      const { target, nowShown, vault } = movedTab()
      const writer = aWriter(new FakeNoteLocator().withOpenNote('todo.md', nowShown), vault)

      const result = await writer.write(target, {
        kind: 'insertAt',
        location: 'noteEnd',
        content: '\n- eggs',
      })

      expect(result).toMatchObject({ applied: true, wroteThrough: 'vault' })
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

  // The defect this spec is about. The handle is the turn's own and the path is
  // the target's, so the identity test alone passes it; only the text says the
  // view is showing a note the file does not hold.
  describe('when the tab shows the path but its editor holds another note', () => {
    it('writes the target through the vault', async () => {
      const { target, stale, vault } = halfOpened()
      const writer = aHalfOpenedWriter(stale, vault)

      await writer.write(target, { kind: 'insertAt', location: 'noteEnd', content: '\n- eggs' })

      expect(vault.contentOf(TARGET)).toBe('- milk\n- eggs')
    })

    // What stops the write reaching the note the editor is still showing.
    it('leaves the stale text in the editor untouched', async () => {
      const { target, stale, vault } = halfOpened()
      const writer = aHalfOpenedWriter(stale, vault)

      await writer.write(target, { kind: 'insertAt', location: 'noteEnd', content: '\n- eggs' })

      expect(stale.content).toBe('# Session transcript')
    })

    it('reports the write went through the vault', async () => {
      const { target, stale, vault } = halfOpened()
      const writer = aHalfOpenedWriter(stale, vault)

      const result = await writer.write(target, {
        kind: 'insertAt',
        location: 'noteEnd',
        content: '\n- eggs',
      })

      expect(result).toMatchObject({ applied: true, wroteThrough: 'vault' })
    })

    it('refuses an anchor the file does not hold', async () => {
      const { target, stale, vault } = halfOpened()
      const writer = aHalfOpenedWriter(stale, vault)

      const result = await writer.write(target, {
        kind: 'replace',
        anchor: '# Session transcript',
        replacement: '- eggs',
      })

      expect(result).toEqual({ applied: false, reason: 'noMatch' })
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

    it('reports the write went through the vault', async () => {
      const target = aTarget(new FakeEditor('- milk'))
      const vault = new FakeVault().withNote(TARGET, '- milk')
      const writer = aWriter(new FakeNoteLocator(), vault)

      const result = await writer.write(target, {
        kind: 'insertAt',
        location: 'noteEnd',
        content: '\n- eggs',
      })

      expect(result).toMatchObject({ applied: true, wroteThrough: 'vault' })
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

  // A note with no leaf anywhere. It is still the turn's target: the write goes
  // through the vault, which costs undo and nothing else, where refusing the
  // turn cost the user the session (D5).
  describe('when the note carries no editor', () => {
    const unopened = (content = '- milk') => ({
      target: new OpenNote(null, TARGET, { line: 0, ch: 0 }),
      vault: new FakeVault().withNote(TARGET, content),
    })

    it('writes through the vault', async () => {
      const { target, vault } = unopened()

      await aWriter(new FakeNoteLocator(), vault).write(target, {
        kind: 'insertAt',
        location: 'noteEnd',
        content: '\n- eggs',
      })

      expect(vault.contentOf(TARGET)).toBe('- milk\n- eggs')
    })

    // What the panel warns on: this is the path that costs the cursor.
    it('reports wroteThrough vault, so the panel says undo is not available', async () => {
      const { target, vault } = unopened()

      const result = await aWriter(new FakeNoteLocator(), vault).write(target, {
        kind: 'insertAt',
        location: 'noteEnd',
        content: '\n- eggs',
      })

      expect(result).toMatchObject({ applied: true, wroteThrough: 'vault' })
    })

    it('reads the file rather than throwing on the null editor', async () => {
      const { target, vault } = unopened()

      expect(await aWriter(new FakeNoteLocator(), vault).read(target)).toBe('- milk')
    })

    it('scrolls nothing and does not throw', () => {
      const { target, vault } = unopened()

      expect(() =>
        aWriter(new FakeNoteLocator(), vault).focusEdit(target, { line: 1, ch: 6 }),
      ).not.toThrow()
    })

    // The deleted note the acceptance criteria reach: the tool result says the
    // anchor was not found, and the model ends the turn saying so.
    it('reports noMatch when the file is gone as well', async () => {
      const target = new OpenNote(null, TARGET, { line: 0, ch: 0 })

      const result = await aWriter(new FakeNoteLocator(), new FakeVault()).write(target, {
        kind: 'insertAt',
        location: 'noteEnd',
        content: '\n- eggs',
      })

      expect(result).toEqual({ applied: false, reason: 'noMatch' })
    })
  })

  // Only the note in front is scrolled, which is the whole of the guard: the
  // note behind the panel and the note in a background tab are the same answer
  // reached from the two platforms, mobile and desktop (D6).
  describe('when focusing the edit at the end of a turn', () => {
    const aFocusWriter = (editor: FakeEditor, workspace: FakeWorkspace) =>
      aWriter(
        new FakeNoteLocator().withOpenNote(TARGET, editor),
        new FakeVault().withNote(TARGET, editor.getValue()),
        workspace,
      )

    it('moves the cursor when the user is looking at the note', () => {
      const editor = new FakeEditor('- milk\n- eggs')
      const workspace = new FakeWorkspace()
        .withEditor(TARGET, editor.asEditor())
        .isLookingAt(TARGET)

      aFocusWriter(editor, workspace).focusEdit(aTarget(editor), { line: 1, ch: 6 })

      expect(editor.cursor).toEqual({ line: 1, ch: 6 })
    })

    it('leaves the cursor alone when the note is open behind the panel', () => {
      const editor = new FakeEditor('- milk\n- eggs')
      const workspace = new FakeWorkspace().withEditor(TARGET, editor.asEditor()).isLookingAt(null)

      aFocusWriter(editor, workspace).focusEdit(aTarget(editor), { line: 1, ch: 6 })

      expect(editor.cursor).toEqual({ line: 0, ch: 0 })
    })

    it('leaves the cursor alone when another note is in front', () => {
      const editor = new FakeEditor('- milk\n- eggs')
      const workspace = new FakeWorkspace()
        .withEditor(TARGET, editor.asEditor())
        .withEditor('todo.md', new FakeEditor('# Todo').asEditor())
        .isLookingAt('todo.md')

      aFocusWriter(editor, workspace).focusEdit(aTarget(editor), { line: 1, ch: 6 })

      expect(editor.cursor).toEqual({ line: 0, ch: 0 })
    })
  })

  describe('when reading the target', () => {
    it('reads the editor when its text is the file the path names', async () => {
      const editor = new FakeEditor('- milk')
      const writer = aLoadedWriter(editor)

      expect(await writer.read(aTarget(editor))).toBe('- milk')
    })

    it('reads the file when the editor holds another note', async () => {
      const { target, stale, vault } = halfOpened()

      expect(await aHalfOpenedWriter(stale, vault).read(target)).toBe('- milk')
    })

    // An unloaded editor and an empty note both read as the empty string, so
    // the check cannot tell them apart and both take the vault.
    it('reads the empty string when the path is not a note in the vault', async () => {
      const editor = new FakeEditor('- milk')
      const writer = aWriter(new FakeNoteLocator().withOpenNote(TARGET, editor), new FakeVault())

      expect(await writer.read(aTarget(editor))).toBe('')
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
    it('describes the editor when its text is the file the path names', async () => {
      const editor = new FakeEditor('- milk')
      const writer = aLoadedWriter(editor)

      expect(await writer.getDetails(aTarget(editor))).toEqual(
        new NoteDetails(TARGET, '- milk', { line: 0, ch: 0 }),
      )
    })

    // The defect stated as the model sees it: the path and the body it is shown
    // under it came from two different notes.
    it('carries the file body under the path when the editor holds another note', async () => {
      const { target, stale, vault } = halfOpened()

      expect(await aHalfOpenedWriter(stale, vault).getDetails(target)).toEqual(
        new NoteDetails(TARGET, '- milk', { line: 0, ch: 0 }),
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
