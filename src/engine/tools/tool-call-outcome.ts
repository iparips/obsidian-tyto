import { EditorPosition } from 'obsidian'

// What one tool call did, as the loop needs to see it: the text the model
// reads, plus the two facts the loop acts on. Built through the factories, so
// a refusal cannot be recorded as an edit or the other way round.
export class ToolCallOutcome {
  private constructor(
    readonly result: string,
    // Absent when the call changed nothing, so the turn keeps the position of
    // the last call that did.
    readonly editedTo?: EditorPosition,
    // Set when the call was refused, so the loop counts repeats without reading
    // meaning into the result text.
    readonly refusal?: string,
  ) {}

  // The ordinary case: the model reads the text and the loop does nothing else.
  static of(result: string): ToolCallOutcome {
    return new ToolCallOutcome(result)
  }

  static refused(reason: string): ToolCallOutcome {
    return new ToolCallOutcome(reason, undefined, reason)
  }

  static edited(result: string, editedTo: EditorPosition): ToolCallOutcome {
    return new ToolCallOutcome(result, editedTo)
  }

  // An edit tool that changed nothing was refused, whatever it said: the reason
  // is its own result text, which is what the panel already shows.
  asRefusal(): ToolCallOutcome {
    return ToolCallOutcome.refused(this.result)
  }
}
