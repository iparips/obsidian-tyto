import { Skill } from '../../skills/skill'
import { ApplicableSkills } from './applicable-skills'
import {
  SkillDeclarationOutcome,
  SkillDeclarationNotSatisfied,
  SkillDeclarationSatisfied,
} from './skill-declaration-outcome'

// Checks the rule a guarded call must satisfy: it declares the skills covering
// its utterance, every name is one the vault defines, and every name is one
// this session has read. The harness never decides which skill fits; it holds
// the model to the names it chose itself.
//
// Built only where the vault defines skills. Whether the rule applies is the
// caller's question, and one asked of the vault rather than of a declaration.
//
// Both lists are values the caller read off its repositories, so this holds no
// collaborator and can be checked without one.
export class SkillDeclarationChecker {
  constructor(
    private readonly vaultSkills: readonly Skill[],
    private readonly namesRead: readonly string[],
  ) {}

  // The vault is checked before the session, so a name it never defined is
  // answered with the real list rather than told to load what does not exist.
  check(declaredSkills: ApplicableSkills): SkillDeclarationOutcome {
    if (!declaredSkills.declared) return SkillDeclarationNotSatisfied.notDeclared()
    const notDefined = this.getNamesNotDefinedByVault(declaredSkills.names)
    if (notDefined.length > 0)
      return SkillDeclarationNotSatisfied.notDefinedByVault(notDefined, this.getVaultSkillNames())
    const notRead = this.getNamesNotReadThisSession(declaredSkills.names)
    if (notRead.length > 0) return SkillDeclarationNotSatisfied.notReadThisSession(notRead)
    return new SkillDeclarationSatisfied()
  }

  private getNamesNotDefinedByVault(names: readonly string[]): readonly string[] {
    const defined = this.getVaultSkillNames()
    return names.filter((name) => !defined.includes(name))
  }

  private getNamesNotReadThisSession(names: readonly string[]): readonly string[] {
    return names.filter((name) => !this.namesRead.includes(name))
  }

  private getVaultSkillNames(): readonly string[] {
    return this.vaultSkills.map((skill) => skill.name)
  }
}
