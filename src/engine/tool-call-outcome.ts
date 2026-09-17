import { EditorPosition } from 'obsidian'
import { WritePath } from './note-editing/target-note-writer'

// What one tool call did, as the loop needs to see it: the text the model
// reads, plus the two facts the loop acts on. Built through the factories, so
// a refusal cannot be recorded as an edit or the other way round.
export class ToolCallOutcome {
  private constructor(
    readonly result: string,
    // Absent when the call changed nothing, so the turn keeps the position of
    // the last call that did.
    readonly editEndPosition?: EditorPosition,
    // Set when the call was refused, so the loop counts repeats without reading
    // meaning into the result text.
    readonly refusal?: string,
    // What the panel shows where that is not what the model reads. An applied
    // edit names its operation and note for the model, which the step would
    // then say a second time beside the path it already carries.
    private panelSummary?: string,
    // Which of the two paths the write took, so the panel can warn about the
    // one the editor cannot undo. Absent where the call wrote nothing.
    readonly wroteThrough?: WritePath,
  ) {}

  descriptionForUser(): string {
    return this.panelSummary ?? this.result
  }

  // The ordinary case: the model reads the text and the loop does nothing else.
  static of(result: string): ToolCallOutcome {
    return new ToolCallOutcome(result)
  }

  static refused(reason: string): ToolCallOutcome {
    return new ToolCallOutcome(reason, undefined, reason)
  }

  static edited(
    result: string,
    editEndPosition: EditorPosition,
    wroteThrough: WritePath,
    panelSummary?: string,
  ): ToolCallOutcome {
    return new ToolCallOutcome(result, editEndPosition, undefined, panelSummary, wroteThrough)
  }

  // An edit tool that changed nothing was refused, whatever it said: the reason
  // is its own result text, which is what the panel already shows.
  asRefusal(): ToolCallOutcome {
    return ToolCallOutcome.refused(this.result)
  }
}
