import { APPLICABLE_SKILLS, ToolCall } from '../../model/providers/models/tool-call'

// The skills one call declared cover its utterance. A value: it reads the call
// and holds the names, and knows nothing about what the vault defines or what
// the session has read.
export class ApplicableSkills {
  private constructor(
    // An omitted argument and a declared [] both arrive as an empty array and
    // say different things: one names no skill, the other answers nothing.
    readonly declared: boolean,
    readonly names: readonly string[],
  ) {}

  static from(call: ToolCall): ApplicableSkills {
    return new ApplicableSkills(
      call.declaresArgument(APPLICABLE_SKILLS),
      call.stringsArgument(APPLICABLE_SKILLS),
    )
  }
}
