import { EditorPosition, TAbstractFile, TFile, Vault } from 'obsidian'
import { EditOperation, NoteEditor, PlannedWrite } from './note-editor'
import { NoteDetails } from './note-details'
import { OpenNote } from './open-note'
import { WorkspaceNoteLocator } from '../note-binding/workspace-note-locator'

// Which of the two paths a write took. The vault path costs the cursor, and the
// panel warns about it, so the result says which rather than leaving the caller
// to ask the workspace a question the write already answered.
export type WritePath = 'editor' | 'vault'

// endedAt is where the edit finished, so the caller can focus it later without
// the editor remembering anything.
export type ApplyResult =
  | { applied: true; endedAt: EditorPosition; wroteThrough: WritePath }
  | { applied: false; reason: 'noMatch' | 'multipleMatches' }

// Where an edit lands. An Editor belongs to a tab rather than to a file, so the
// handle a turn holds can come to show another note; the path is asked for
// again and the write goes to the vault where it has.
export class TargetNoteWriter {
  constructor(
    private noteEditor: NoteEditor,
    private noteLocator: WorkspaceNoteLocator,
    private vault: Vault,
  ) {}

  async write(note: OpenNote, op: EditOperation): Promise<ApplyResult> {
    if (this.tabStillShows(note)) return this.writeThroughEditor(note, op)
    return this.writeThroughVault(note, op)
  }

  // Focusing asks the same question the write does: a tab that moved would
  // scroll whatever note it moved to, which is the defect in another form.
  focusEdit(note: OpenNote, position: EditorPosition): void {
    if (this.tabStillShows(note)) this.noteEditor.focusEdit(note.editor, position)
  }

  // The note as the model is shown it. Built here rather than on OpenNote so
  // the content under the path comes from the same place a write would go.
  async getDetails(note: OpenNote): Promise<NoteDetails> {
    return new NoteDetails(note.path, await this.read(note), note.cursorAtStart)
  }

  // What the note holds now, from wherever the next write to it would go, so a
  // guard comparing against it cannot be reading a note the tab moved to.
  async read(note: OpenNote): Promise<string> {
    if (this.tabStillShows(note)) return note.editor.getValue()
    const file = this.vault.getAbstractFileByPath(note.path)
    if (!TargetNoteWriter.isNote(file)) return ''
    return this.vault.cachedRead(file)
  }

  // The same handle the locator answers with means the tab has not moved, so
  // the write goes through the editor and keeps undo and the cursor.
  private tabStillShows(note: OpenNote): boolean {
    const located = this.noteLocator.locate(note.path)
    return located.succeeded() && located.value.editor === note.editor
  }

  private writeThroughEditor(note: OpenNote, op: EditOperation): ApplyResult {
    const planned = this.noteEditor.plan(note.editor.getValue(), note.cursorAtStart, op)
    if (!planned.applied) return planned
    note.editor.replaceRange(planned.write.replacement, planned.write.from, planned.write.to)
    return { applied: true, endedAt: planned.write.endedAt, wroteThrough: 'editor' }
  }

  private async writeThroughVault(note: OpenNote, op: EditOperation): Promise<ApplyResult> {
    const file = this.vault.getAbstractFileByPath(note.path)
    if (!TargetNoteWriter.isNote(file)) return { applied: false, reason: 'noMatch' }
    return TargetNoteWriter.resultOf(await this.processFile(file, note, op))
  }

  // process reads, modifies and saves atomically, so the note cannot be written
  // from text that went stale between the read and the write. The plan is made
  // inside the callback because the text it edits is what process just read.
  private async processFile(file: TFile, note: OpenNote, op: EditOperation): Promise<PlannedWrite> {
    const planned: PlannedWrite[] = []
    await this.vault.process(file, (before) => {
      planned.push(this.noteEditor.plan(before, note.cursorAtStart, op))
      return TargetNoteWriter.contentToSave(planned[0], before)
    })
    return planned[0]
  }

  private static contentToSave(planned: PlannedWrite, before: string): string {
    return planned.applied ? planned.write.content : before
  }

  private static resultOf(planned: PlannedWrite): ApplyResult {
    if (!planned.applied) return planned
    return { applied: true, endedAt: planned.write.endedAt, wroteThrough: 'vault' }
  }

  private static isNote(file: TAbstractFile | null): file is TFile {
    return file !== null && 'stat' in file
  }
}
