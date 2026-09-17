import { EditorPosition, TAbstractFile, TFile, Vault, Workspace } from 'obsidian'
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
    private workspace: Workspace,
  ) {}

  // wroteThroughEditor is the turn's own record for this path, which says
  // whether the view may be flushed before the comparison.
  async write(note: OpenNote, op: EditOperation, wroteThroughEditor = false): Promise<ApplyResult> {
    if (await this.editorHoldsTheNote(note, wroteThroughEditor))
      return this.writeThroughEditor(note, op)
    return this.writeThroughVault(note, op)
  }

  // Only the note the user is looking at. Scrolling one behind the panel moves
  // a screen nobody asked to move, which on mobile is every turn, since the
  // panel always holds the screen there.
  focusEdit(note: OpenNote, position: EditorPosition): void {
    if (this.userIsLookingAt(note)) this.noteEditor.focusEdit(note.editor, position)
  }

  private userIsLookingAt(note: OpenNote): boolean {
    return note.editor === this.workspace.activeEditor?.editor
  }

  // The note as the model is shown it. Built here rather than on OpenNote so
  // the content under the path comes from the same place a write would go.
  async getDetails(note: OpenNote, wroteThroughEditor = false): Promise<NoteDetails> {
    return new NoteDetails(note.path, await this.read(note, wroteThroughEditor), note.cursorAtStart)
  }

  // What the note holds now, from wherever the next write to it would go, so a
  // guard comparing against it cannot be reading a note the tab moved to.
  async read(note: OpenNote, wroteThroughEditor = false): Promise<string> {
    if (await this.editorHoldsTheNote(note, wroteThroughEditor)) return note.editor.getValue()
    return this.readFile(note.path)
  }

  // A tab that moved answers with another handle. A tab that has not finished
  // loading answers with this one and holds the previous note's text, so the
  // handle is trusted only where the two agree.
  private async editorHoldsTheNote(note: OpenNote, wroteThroughEditor: boolean): Promise<boolean> {
    if (!(await this.tabShowsPath(note))) return false
    // Only a view this turn already wrote through: it passed this test to earn
    // that write, so flushing it writes back what it was trusted with. A save
    // writes the editor over the file, so flushing a half-opened one would put
    // the note it still shows under the target's path.
    if (wroteThroughEditor) await this.noteLocator.saveOpenNote(note.path)
    return note.editor.getValue() === (await this.readFile(note.path))
  }

  // The same handle the locator answers with means the tab has not moved, so
  // the write goes through the editor and keeps undo and the cursor.
  private async tabShowsPath(note: OpenNote): Promise<boolean> {
    const located = await this.noteLocator.locate(note.path)
    return located.succeeded() && located.value.editor === note.editor
  }

  private async readFile(path: string): Promise<string> {
    const file = this.vault.getAbstractFileByPath(path)
    if (!TargetNoteWriter.isNote(file)) return ''
    return this.vault.cachedRead(file)
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
