import { ToolCall } from '../../model/providers/types'
import { EditOperation, NoteEditor } from '../note-editing/note-editor'
import { NoteOperationParser } from '../note-editing/note-operation-parser'
import { OpenNote } from '../note-editing/open-note'
import { TurnRepository } from '../turn/turn-repository'
import { ToolCallOutcome } from '../tool-call-outcome'

export class NoteEditTool {
  constructor(
    private noteEditor: NoteEditor,
    private turnRepository: TurnRepository,
  ) {}

  execute(call: ToolCall): ToolCallOutcome {
    const refused = this.turnRepository.refusedOpen()
    if (refused)
      return ToolCallOutcome.of(
        `your open of ${refused} was refused, so it is not the note this edit would reach; call choose_note with it, open it, then edit. Never edit the note bound from an earlier turn`,
      )
    const unwritable = this.turnRepository.unwritableNote()
    if (unwritable)
      return ToolCallOutcome.of(
        `${unwritable} is not editable yet; stop and tell the user to open it`,
      )
    const note = this.turnRepository.targetNote()
    if (!note)
      return ToolCallOutcome.of('no note is open; tell the user to open one before editing')
    return this.callToolOnNote(call, note)
  }

  private callToolOnNote(call: ToolCall, note: OpenNote): ToolCallOutcome {
    const parsed = NoteOperationParser.parse(call)
    if (parsed.hasFailed()) return ToolCallOutcome.of(`invalid arguments: ${parsed.message}`)
    return this.applyOperation(parsed.value, note)
  }

  private applyOperation(op: EditOperation, note: OpenNote): ToolCallOutcome {
    const result = this.noteEditor.apply(note.editor, note.details(), op)
    if (result.applied) return ToolCallOutcome.edited('applied', result.endedAt)
    if (result.reason === 'noMatch') return ToolCallOutcome.of('anchor not found in note')
    return ToolCallOutcome.of('anchor matches multiple places; use a longer anchor')
  }
}
