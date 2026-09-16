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
    return this.applyOperation(call.name, parsed.value, note)
  }

  // The bare string `applied` carried no tense and no target, so a batch gave
  // the model two identical results and it read one as an earlier edit.
  //
  // The content is not echoed: the model sent it one message earlier, and a
  // dictated paragraph makes that cost unbounded. The path and the line are
  // short and fixed-cost, and are what the model cannot infer.
  private applyOperation(tool: string, op: EditOperation, note: OpenNote): ToolCallOutcome {
    const result = this.noteEditor.apply(note.editor, note.details(), op)
    if (result.applied)
      return ToolCallOutcome.edited(
        `${tool} applied to ${note.path}, ending at line ${result.endedAt.line + 1}`,
        result.endedAt,
        'applied',
      )
    if (result.reason === 'noMatch') return ToolCallOutcome.of('anchor not found in note')
    return ToolCallOutcome.of('anchor matches multiple places; use a longer anchor')
  }
}
