import { ApplicableSkills } from './applicable-skills'
import { SkillsInSessionChecker } from './skills-in-session-checker'
import {
  SkillDeclarationVerdict,
  SkillsDeclarationSatisfied,
  SkillsNotDeclared,
  SkillsNotDefinedByVault,
  SkillsNotReadThisSession,
} from './skill-declaration-verdict'

// The rule a guarded call must satisfy: it declares the skills covering its
// utterance, every name is one the vault defines, and every name is one this
// session has read. The harness never decides which skill fits; it holds the
// model to the names it chose itself.
export class SkillDeclarationPolicy {
  // The vault is checked before the session, so a name it never defined is
  // answered with the real list rather than told to load what does not exist.
  static judge(
    applicable: ApplicableSkills,
    checker: SkillsInSessionChecker,
  ): SkillDeclarationVerdict {
    if (!applicable.declared) return new SkillsNotDeclared()
    const notDefined = checker.getNamesNotDefinedByVault(applicable.names)
    if (notDefined.length > 0)
      return new SkillsNotDefinedByVault(notDefined, checker.getVaultSkillNames())
    const notRead = checker.getNamesNotReadThisSession(applicable.names)
    if (notRead.length > 0) return new SkillsNotReadThisSession(notRead)
    return new SkillsDeclarationSatisfied()
  }
}
