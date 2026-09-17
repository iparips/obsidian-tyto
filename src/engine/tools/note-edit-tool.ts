import { ToolCall } from '../../model/providers/types'
import { EditOperation } from '../note-editing/note-editor'
import { ApplyResult, TargetNoteWriter } from '../note-editing/target-note-writer'
import { NoteChoiceService } from '../waiting/note-choice-service'
import { NoteOperationParser } from '../note-editing/note-operation-parser'
import { OpenNote } from '../note-editing/open-note'
import { TurnRepository } from '../turn/turn-repository'
import { ToolCallOutcome } from '../tool-call-outcome'

export class NoteEditTool {
  constructor(
    private targetNoteWriter: TargetNoteWriter,
    private turnRepository: TurnRepository,
    private noteChoiceService: NoteChoiceService,
  ) {}

  async execute(call: ToolCall): Promise<ToolCallOutcome> {
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

  private async callToolOnNote(call: ToolCall, note: OpenNote): Promise<ToolCallOutcome> {
    const parsed = NoteOperationParser.parse(call)
    if (parsed.hasFailed()) return ToolCallOutcome.of(`invalid arguments: ${parsed.message}`)
    if (!call.isWriteNote()) return this.applyOperation(call.name, parsed.value, note)
    return this.applyGuardedWrite(call, parsed.value, note)
  }

  // The two refusals come before the confirmation, so a user is only asked
  // about a write that is current: asking about one already doomed spends a
  // prompt on nothing.
  private async applyGuardedWrite(
    call: ToolCall,
    op: EditOperation,
    note: OpenNote,
  ): Promise<ToolCallOutcome> {
    const refusal = await this.refuseUncurrentWrite(call, note)
    if (refusal) return refusal
    if (!(await this.noteChoiceService.confirmsWrite(note.path)))
      return ToolCallOutcome.of(`the user declined the write to ${note.path}`)
    return this.applyOperation(call.name, op, note)
  }

  // A rewrite applies whatever it is given where an anchor fails loudly, so it
  // is refused unless the model read this note this turn and the note still
  // matches what that read returned.
  private async refuseUncurrentWrite(
    call: ToolCall,
    note: OpenNote,
  ): Promise<ToolCallOutcome | null> {
    if (!this.turnRepository.notesRead.includes(note.path))
      return ToolCallOutcome.of(
        `call read_note on ${note.path} in this turn before writing the whole of it`,
      )
    if ((await this.readNote(note)) !== call.argument('read_content'))
      return ToolCallOutcome.of(
        `${note.path} has changed since you read it; read it again and rewrite from what it says now`,
      )
    return null
  }

  // The bare string `applied` carried no tense and no target, so a batch gave
  // the model two identical results and it read one as an earlier edit.
  //
  // The content is not echoed: the model sent it one message earlier, and a
  // dictated paragraph makes that cost unbounded. The path and the line are
  // short and fixed-cost, and are what the model cannot infer.
  private async applyOperation(
    tool: string,
    op: EditOperation,
    note: OpenNote,
  ): Promise<ToolCallOutcome> {
    const result = await this.writeRecordingThePath(note, op)
    if (result.applied)
      return ToolCallOutcome.edited(
        `${tool} applied to ${note.path}, ending at line ${result.endedAt.line + 1}`,
        result.endedAt,
        result.wroteThrough,
        'applied',
      )
    if (result.reason === 'noMatch') return ToolCallOutcome.of('anchor not found in note')
    return ToolCallOutcome.of('anchor matches multiple places; use a longer anchor')
  }

  // The record is what lets the next trust test flush this view before it
  // compares, so it is written here rather than left to the caller to remember.
  private async writeRecordingThePath(note: OpenNote, op: EditOperation): Promise<ApplyResult> {
    const wroteThroughEditor = this.turnRepository.wasWrittenThroughEditor(note.path)
    const result = await this.targetNoteWriter.write(note, op, wroteThroughEditor)
    if (result.applied && result.wroteThrough === 'editor')
      this.turnRepository.recordWrittenThroughEditor(note.path)
    return result
  }

  private async readNote(note: OpenNote): Promise<string> {
    return this.targetNoteWriter.read(note, this.turnRepository.wasWrittenThroughEditor(note.path))
  }
}
