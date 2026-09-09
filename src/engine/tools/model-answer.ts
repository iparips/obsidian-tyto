import { ToolCall } from '../../model/providers/types'

// A value: the answer the model drew from the vault, and the notes it drew on.
// Holds no collaborator, so the panel renders it without reaching back.
export class ModelAnswer {
  constructor(
    readonly text: string,
    readonly sources: string[],
  ) {}

  static from(call: ToolCall): ModelAnswer {
    return new ModelAnswer(call.argument('answer'), call.stringsArgument('sources'))
  }
}
