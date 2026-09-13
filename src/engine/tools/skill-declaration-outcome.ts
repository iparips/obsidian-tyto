// What checking one call's declared skills found. Four states rather than a
// nullable refusal, because "declared nothing", "named what the vault lacks"
// and "named what this session has not read" are different facts about a call
// and each names a different way past it.
export type SkillDeclarationOutcome =
  | SkillsDeclarationSatisfied
  | SkillsNotDeclared
  | SkillsNotDefinedByVault
  | SkillsNotReadThisSession

// Every declared name is one the vault defines and this session has read. An
// empty declaration lands here too, having named no skill to check.
export class SkillsDeclarationSatisfied {
  refusalOrNull(): string | null {
    return null
  }
}

// The call sent no applicable_skills at all, which is a different claim from
// declaring none: one answers nothing, the other says no skill covers this.
export class SkillsNotDeclared {
  refusalOrNull(): string | null {
    return 'this vault defines skills, so every call that reaches it must send applicable_skills: the names covering this utterance, or [] when none does'
  }
}

// Carries what the vault does define, since handing back the real names is the
// whole point of failing here rather than telling the model to load one.
export class SkillsNotDefinedByVault {
  constructor(
    readonly names: readonly string[],
    readonly vaultSkillNames: readonly string[],
  ) {}

  refusalOrNull(): string | null {
    return `no skill in this vault is named ${this.names.join(', ')}; this vault defines ${this.vaultSkillNames.join(', ')}`
  }
}

// Carries the names to load, since a refusal that only reports the block is one
// the model answers by retrying the same call.
export class SkillsNotReadThisSession {
  constructor(readonly names: readonly string[]) {}

  refusalOrNull(): string | null {
    return `load ${this.names.join(', ')}, then call this again declaring it`
  }
}
