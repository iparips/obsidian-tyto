import { APPLICABLE_SKILLS, ToolCall } from '../../model/providers/models/tool-call'

// The skills one call declared cover its utterance, or the absence of any
// answer. Two states rather than a list and a flag, because an omitted argument
// and a declared [] both read as an empty list and say different things: one
// answers nothing, the other says no skill covers this.
export type ApplicableSkills = SkillsDeclared | NoSkillsArgumentSent

// The call answered the question. An empty list is an answer: no skill covers
// this utterance.
export class SkillsDeclared {
  constructor(readonly names: readonly string[]) {}

  // Narrows rather than returning a plain boolean, so a caller that checks it
  // reaches names without a cast, the way TargetResolution does.
  arePresent(): this is SkillsDeclared {
    return true
  }
}

// The call left a required argument off, which is no answer at all.
export class NoSkillsArgumentSent {
  arePresent(): this is SkillsDeclared {
    return false
  }
}

export class ApplicableSkillsFactory {
  // Reads whether the raw argument is there as well as its contents, since only
  // its presence tells the two states apart.
  static from(call: ToolCall): ApplicableSkills {
    if (!call.declaresArgument(APPLICABLE_SKILLS)) return new NoSkillsArgumentSent()
    return new SkillsDeclared(call.stringsArgument(APPLICABLE_SKILLS))
  }
}
