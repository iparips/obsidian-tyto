export type SkillDeclarationOutcome = SkillDeclarationSatisfied | SkillDeclarationNotSatisfied

export class SkillDeclarationSatisfied {
  refusalOrNull(): string | null {
    return null
  }
}

// Each refusal names the way past it: one that only reports the block is one
// the model answers by retrying the same call.
export class SkillDeclarationNotSatisfied {
  private constructor(private readonly reason: string) {}

  static missingApplicableSkillsInInput(): SkillDeclarationNotSatisfied {
    return new SkillDeclarationNotSatisfied(
      'this vault defines skills, so every call that reaches it must send applicable_skills: the names covering this utterance, or [] when none does',
    )
  }

  // Lists what the vault defines, so a model that guessed does not search for
  // the list it was already sent.
  static requestedSkillsNotDefinedByVault(
    names: readonly string[],
    vaultSkillNames: readonly string[],
  ): SkillDeclarationNotSatisfied {
    return new SkillDeclarationNotSatisfied(
      `no skill in this vault is named ${names.join(', ')}; this vault defines ${vaultSkillNames.join(', ')}`,
    )
  }

  static someApplicableSkillsNotInSession(names: readonly string[]): SkillDeclarationNotSatisfied {
    return new SkillDeclarationNotSatisfied(
      `load ${names.join(', ')}, then call this again declaring it`,
    )
  }

  refusalOrNull(): string | null {
    return this.reason
  }
}
