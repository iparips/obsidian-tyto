// Whether one call's declared skills hold, and why not when they do not. Each
// state carries only what its message needs, so the wording is written from the
// names rather than from a flag read back out.
export type SkillDeclarationVerdict =
  | SkillsDeclarationSatisfied
  | SkillsNotDeclared
  | SkillsNotDefinedByVault
  | SkillsNotReadThisSession

// The call may proceed. An empty declaration lands here too, having named no
// skill to check.
export class SkillsDeclarationSatisfied {
  readonly refusal = null
}

// The call sent no applicable_skills at all, which is a different claim from
// declaring none: one answers nothing, the other says no skill covers this.
export class SkillsNotDeclared {
  readonly refusal =
    'this vault defines skills, so every call that reaches it must send applicable_skills: the names covering this utterance, or [] when none does'
}

// Named with what the vault does define, so a model that guessed has the real
// names in front of it rather than having to search for them again.
export class SkillsNotDefinedByVault {
  constructor(
    private readonly names: readonly string[],
    private readonly vaultSkillNames: readonly string[],
  ) {}

  get refusal(): string {
    return `no skill in this vault is named ${this.names.join(', ')}; this vault defines ${this.vaultSkillNames.join(', ')}`
  }
}

// Names what to load rather than asking the model to work it out: a refusal
// that only reports the block is one the model answers by retrying.
export class SkillsNotReadThisSession {
  constructor(private readonly names: readonly string[]) {}

  get refusal(): string {
    return `load ${this.names.join(', ')}, then call this again declaring it`
  }
}
