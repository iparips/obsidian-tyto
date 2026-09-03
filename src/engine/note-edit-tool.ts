import { ToolCall } from '../providers/types'
import { EditOperation, NoteEditor } from './note-editor'
import { NoteOperationParser } from './note-operation-parser'
import { OpenNote } from './models/open-note'
import { TurnRepository } from './turn-repository'
import { ToolCallOutcome } from './models/tool-call-outcome'

const UNSETTLED_SKILLS =
  'this vault defines skills and you have not checked them; call load_skill for the one that covers this, or no_skill_applies if none does, then edit'

// What an edit tool does to the target note, which is the half of a tool call
// that touches the vault. Separate from the dispatcher so routing a call and
// writing to a note are one responsibility each.
export class NoteEditTool {
  constructor(
    private noteEditor: NoteEditor,
    private turnRepository: TurnRepository,
  ) {}

  // Refused rather than applied to the note the turn still holds: that note is
  // no longer the target, and editing it would write to the wrong file.
  execute(call: ToolCall): ToolCallOutcome {
    // Ordering, not relevance: the model decides which skill applies, or that
    // none does, and the harness only holds it to deciding before it writes.
    // Refused once per turn, since either answer settles it.
    if (this.turnRepository.mustSettleSkills()) return { result: UNSETTLED_SKILLS }
    const unwritable = this.turnRepository.unwritableNote()
    if (unwritable)
      return { result: `${unwritable} is not editable yet; stop and tell the user to open it` }
    const note = this.turnRepository.targetNote()
    // Told rather than thrown, so the model reports it in the reply instead of
    // retrying an edit that cannot land.
    if (!note) return { result: 'no note is open; tell the user to open one before editing' }
    // The binding a turn inherits is a path, and the editor it resolves to may
    // be one Obsidian still reports but no longer shows. Once the model has
    // searched, only a note it chose and opened this turn is known to be live.
    if (!this.turnRepository.mayEdit(note.path))
      return { result: NoteEditTool.unopenedMessage(note.path) }
    return this.callToolOnNote(call, note)
  }

  private static unopenedMessage(path: string): string {
    return `${path} was not opened this turn; offer it with choose_note and open it before editing`
  }

  private callToolOnNote(call: ToolCall, note: OpenNote): ToolCallOutcome {
    const parsed = NoteOperationParser.parse(call)
    if (parsed.hasFailed()) return { result: `invalid arguments: ${parsed.message}` }
    return this.applyOperation(parsed.value, note)
  }

  private applyOperation(op: EditOperation, note: OpenNote): ToolCallOutcome {
    const result = this.noteEditor.apply(note.editor, note.details(), op)
    if (result.applied) return { result: 'applied', editedTo: result.endedAt }
    if (result.reason === 'noMatch') return { result: 'anchor not found in note' }
    return { result: 'anchor matches multiple places; use a longer anchor' }
  }
}
