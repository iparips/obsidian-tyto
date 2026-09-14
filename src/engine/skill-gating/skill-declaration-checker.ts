import { Skill } from '../../skills/skill'
import { ApplicableSkills } from './applicable-skills'
import {
  SkillDeclarationOutcome,
  SkillDeclarationNotSatisfied,
  SkillDeclarationSatisfied,
} from './skill-declaration-outcome'

export class SkillDeclarationChecker {
  constructor(
    private readonly vaultSkills: readonly Skill[],
    private readonly namesRead: readonly string[],
  ) {}

  // The vault is checked before the session, so a typo is answered with the
  // list rather than told to load what does not exist.
  check(declaredSkills: ApplicableSkills): SkillDeclarationOutcome {
    if (!declaredSkills.arePresent())
      return SkillDeclarationNotSatisfied.missingApplicableSkillsInInput()
    const unknownSkills = this.findUnknownSkills(declaredSkills.names)
    if (unknownSkills.length > 0)
      return SkillDeclarationNotSatisfied.requestedSkillsNotDefinedByVault(
        unknownSkills,
        this.getVaultSkillNames(),
      )
    const skillsNotRead = this.getSkillNamesNotInSession(declaredSkills.names)
    if (skillsNotRead.length > 0)
      return SkillDeclarationNotSatisfied.someApplicableSkillsNotInSession(skillsNotRead)
    return new SkillDeclarationSatisfied()
  }

  private findUnknownSkills(names: readonly string[]): readonly string[] {
    const defined = this.getVaultSkillNames()
    return names.filter((name) => !defined.includes(name))
  }

  private getSkillNamesNotInSession(names: readonly string[]): readonly string[] {
    return names.filter((name) => !this.namesRead.includes(name))
  }

  private getVaultSkillNames(): readonly string[] {
    return this.vaultSkills.map((skill) => skill.name)
  }
}
