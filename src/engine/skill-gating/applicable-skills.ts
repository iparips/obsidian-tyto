import { APPLICABLE_SKILLS, ToolCall } from '../../model/providers/models/tool-call'

// Two states rather than a list and a flag: an omitted argument and a declared
// [] both read as an empty list and say different things.
export type ApplicableSkills = SkillsDeclared | NoSkillsArgumentSent

export class SkillsDeclared {
  constructor(readonly names: readonly string[]) {}

  // Narrows, so a caller reaches names without a cast.
  arePresent(): this is SkillsDeclared {
    return true
  }
}

export class NoSkillsArgumentSent {
  arePresent(): this is SkillsDeclared {
    return false
  }
}

export class ApplicableSkillsFactory {
  static from(call: ToolCall): ApplicableSkills {
    if (!call.declaresArgument(APPLICABLE_SKILLS)) return new NoSkillsArgumentSent()
    return new SkillsDeclared(call.stringsArgument(APPLICABLE_SKILLS))
  }
}
