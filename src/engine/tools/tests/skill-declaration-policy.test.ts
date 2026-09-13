import { describe, expect, it } from 'vitest'
import { SkillDeclarationPolicy } from '../skill-declaration-policy'
import { ApplicableSkills } from '../applicable-skills'
import { SkillsInSessionChecker } from '../skills-in-session-checker'
import {
  SkillsDeclarationSatisfied,
  SkillsNotDeclared,
  SkillsNotDefinedByVault,
  SkillsNotReadThisSession,
} from '../skill-declaration-verdict'
import { Skill } from '../../../skills/skill'
import { aToolCall } from '../../../test-support/builders'

const JOURNAL = new Skill('journal', 'Writes the daily note.', 'Skills/journal.md')
const SHOPPING = new Skill('shopping', 'Keeps the list.', 'Skills/shopping.md')

const verdictFor = (args: Record<string, unknown>, namesRead: readonly string[] = []) =>
  SkillDeclarationPolicy.judge(
    ApplicableSkills.from(aToolCall('insert_at', args)),
    new SkillsInSessionChecker([JOURNAL, SHOPPING], namesRead),
  )

describe('SkillDeclarationPolicy', () => {
  describe('when the call declares nothing', () => {
    it('judges a call sending no argument as undeclared', () => {
      expect(verdictFor({ location: 'note_end' })).toBeInstanceOf(SkillsNotDeclared)
    })

    it('tells the model to send the argument, naming what an empty list means', () => {
      expect(verdictFor({ location: 'note_end' }).refusal).toContain('or [] when none does')
    })

    it('judges an empty declaration satisfied, since it names nothing to check', () => {
      expect(verdictFor({ applicable_skills: [] })).toBeInstanceOf(SkillsDeclarationSatisfied)
    })

    it('refuses nothing when the declaration is satisfied', () => {
      expect(verdictFor({ applicable_skills: [] }).refusal).toBeNull()
    })
  })

  describe('when the call names a skill the vault defines', () => {
    it('judges a name the session has read satisfied', () => {
      expect(verdictFor({ applicable_skills: ['journal'] }, ['journal'])).toBeInstanceOf(
        SkillsDeclarationSatisfied,
      )
    })

    it('judges a name nothing has read as unread', () => {
      expect(verdictFor({ applicable_skills: ['journal'] })).toBeInstanceOf(
        SkillsNotReadThisSession,
      )
    })

    it('names the skill to load when nothing has read it', () => {
      expect(verdictFor({ applicable_skills: ['journal'] }).refusal).toBe(
        'load journal, then call this again declaring it',
      )
    })

    // Reading one skill does not license another: the rule asks which skill, not
    // whether any was read.
    it('names the unread skill when a different one was read', () => {
      expect(verdictFor({ applicable_skills: ['shopping'] }, ['journal']).refusal).toBe(
        'load shopping, then call this again declaring it',
      )
    })

    it('names every unread skill when several are declared', () => {
      expect(verdictFor({ applicable_skills: ['journal', 'shopping'] }).refusal).toBe(
        'load journal, shopping, then call this again declaring it',
      )
    })
  })

  // Checked before the session, so a typo is never told to load something that
  // does not exist.
  describe('when the call names a skill the vault does not define', () => {
    it('judges the name as undefined by the vault', () => {
      expect(verdictFor({ applicable_skills: ['gardening'] })).toBeInstanceOf(
        SkillsNotDefinedByVault,
      )
    })

    it('lists what the vault defines', () => {
      expect(verdictFor({ applicable_skills: ['gardening'] }).refusal).toBe(
        'no skill in this vault is named gardening; this vault defines journal, shopping',
      )
    })

    it('reports the unknown name rather than asking for it to be loaded', () => {
      expect(
        verdictFor({ applicable_skills: ['journal', 'gardening'] }, ['journal']),
      ).toBeInstanceOf(SkillsNotDefinedByVault)
    })
  })
})
