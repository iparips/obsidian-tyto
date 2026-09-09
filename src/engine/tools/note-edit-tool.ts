import { ToolCall } from '../../model/providers/types'
import { EditOperation, NoteEditor } from '../note-editing/note-editor'
import { NoteOperationParser } from '../note-editing/note-operation-parser'
import { OpenNote } from '../note-editing/open-note'
import { TurnRepository } from '../turn/turn-repository'
import { ToolCallOutcome } from './tool-call-outcome'

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

  // The target is the only editable note, so there is no permission left to
  // check: it moves only through a consented open or a command.
  execute(call: ToolCall): ToolCallOutcome {
    // Ordering, not relevance: the model decides which skill applies, or that
    // none does, and the harness only holds it to deciding before it writes.
    // Refused once per turn, since either answer settles it.
    if (this.turnRepository.mustSettleSkills()) return ToolCallOutcome.of(UNSETTLED_SKILLS)
    const unwritable = this.turnRepository.unwritableNote()
    if (unwritable)
      return ToolCallOutcome.of(
        `${unwritable} is not editable yet; stop and tell the user to open it`,
      )
    const note = this.turnRepository.targetNote()
    // Told rather than thrown, so the model reports it in the reply instead of
    // retrying an edit that cannot land.
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
