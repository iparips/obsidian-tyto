import { Skill } from '../../skills/skill'

// Answers which declared names the vault does not define, and which this
// session has not read. Both lists are values the caller read off its
// repositories, so this holds no collaborator.
export class SkillsInSessionChecker {
  constructor(
    private readonly vaultSkills: readonly Skill[],
    private readonly namesRead: readonly string[],
  ) {}

  getNamesNotDefinedByVault(names: readonly string[]): readonly string[] {
    const defined = this.getVaultSkillNames()
    return names.filter((name) => !defined.includes(name))
  }

  getNamesNotReadThisSession(names: readonly string[]): readonly string[] {
    return names.filter((name) => !this.namesRead.includes(name))
  }

  getVaultSkillNames(): readonly string[] {
    return this.vaultSkills.map((skill) => skill.name)
  }
}
