// Whether one call's declaration of the skills covering its utterance holds.
// Two states, because one caller asks one question: may this call proceed, and
// what is the model told if not. The three ways to fail differ only in wording,
// so each is a factory rather than a state of its own.
export type SkillDeclarationOutcome = SkillDeclarationSatisfied | SkillDeclarationNotSatisfied

// Every declared name is one the vault defines and this session has read. An
// empty declaration lands here, having named no skill to check, and so does
// every call in a vault defining no skills.
export class SkillDeclarationSatisfied {
  refusalOrNull(): string | null {
    return null
  }
}

// Carries what the model is told, which names the way past it: a refusal that
// only reports the block is one the model answers by retrying the same call.
export class SkillDeclarationNotSatisfied {
  private constructor(private readonly reason: string) {}

  // Sending no applicable_skills is a different claim from declaring none: one
  // answers nothing, the other says no skill covers this.
  static notDeclared(): SkillDeclarationNotSatisfied {
    return new SkillDeclarationNotSatisfied(
      'this vault defines skills, so every call that reaches it must send applicable_skills: the names covering this utterance, or [] when none does',
    )
  }

  // Names what the vault does define, so a model that guessed has the real
  // names rather than having to search for them again.
  static notDefinedByVault(
    names: readonly string[],
    vaultSkillNames: readonly string[],
  ): SkillDeclarationNotSatisfied {
    return new SkillDeclarationNotSatisfied(
      `no skill in this vault is named ${names.join(', ')}; this vault defines ${vaultSkillNames.join(', ')}`,
    )
  }

  static notReadThisSession(names: readonly string[]): SkillDeclarationNotSatisfied {
    return new SkillDeclarationNotSatisfied(
      `load ${names.join(', ')}, then call this again declaring it`,
    )
  }

  refusalOrNull(): string | null {
    return this.reason
  }
}
