import { ToolCall } from '../providers/types'
import { EditOperation, NoteEditor } from './note-editor'
import { NoteOperationParser } from './note-operation-parser'
import { OpenNote } from './models/open-note'
import { TurnRepository } from './turn-repository'
import { ToolCallOutcome } from './models/tool-call-outcome'

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
    const unwritable = this.turnRepository.unwritableNote()
    if (unwritable)
      return { result: `${unwritable} is not editable yet; stop and tell the user to open it` }
    const note = this.turnRepository.targetNote()
    // Told rather than thrown, so the model reports it in the reply instead of
    // retrying an edit that cannot land.
    if (!note) return { result: 'no note is open; tell the user to open one before editing' }
    return this.callToolOnNote(call, note)
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
