import { describe, expect, it } from 'vitest'
import { SkillDeclarationChecker } from '../skill-declaration-checker'
import { ApplicableSkills } from '../applicable-skills'
import {
  SkillsDeclarationSatisfied,
  SkillsNotDeclared,
  SkillsNotDefinedByVault,
  SkillsNotReadThisSession,
} from '../skill-declaration-outcome'
import { Skill } from '../../../skills/skill'
import { aToolCall } from '../../../test-support/builders'

const JOURNAL = new Skill('journal', 'Writes the daily note.', 'Skills/journal.md')
const SHOPPING = new Skill('shopping', 'Keeps the list.', 'Skills/shopping.md')

const outcomeOf = (args: Record<string, unknown>, namesRead: readonly string[] = []) =>
  new SkillDeclarationChecker([JOURNAL, SHOPPING], namesRead).check(
    ApplicableSkills.from(aToolCall('insert_at', args)),
  )

describe('SkillDeclarationChecker', () => {
  describe('when the call declares nothing', () => {
    it('reports the call undeclared when the argument is absent', () => {
      expect(outcomeOf({ location: 'note_end' })).toBeInstanceOf(SkillsNotDeclared)
    })

    it('tells the model to send the argument, naming what an empty list means', () => {
      expect(outcomeOf({ location: 'note_end' }).refusalOrNull()).toContain('or [] when none does')
    })

    it('reports an empty declaration satisfied, since it names nothing to check', () => {
      expect(outcomeOf({ applicable_skills: [] })).toBeInstanceOf(SkillsDeclarationSatisfied)
    })

    it('refuses nothing when the declaration is satisfied', () => {
      expect(outcomeOf({ applicable_skills: [] }).refusalOrNull()).toBeNull()
    })
  })

  describe('when the call names a skill the vault defines', () => {
    it('reports a name the session has read satisfied', () => {
      expect(outcomeOf({ applicable_skills: ['journal'] }, ['journal'])).toBeInstanceOf(
        SkillsDeclarationSatisfied,
      )
    })

    it('reports a name nothing has read as unread', () => {
      expect(outcomeOf({ applicable_skills: ['journal'] })).toBeInstanceOf(SkillsNotReadThisSession)
    })

    it('names the skill to load when nothing has read it', () => {
      expect(outcomeOf({ applicable_skills: ['journal'] }).refusalOrNull()).toBe(
        'load journal, then call this again declaring it',
      )
    })

    // Reading one skill does not license another: the rule asks which skill, not
    // whether any was read.
    it('names the unread skill when a different one was read', () => {
      expect(outcomeOf({ applicable_skills: ['shopping'] }, ['journal']).refusalOrNull()).toBe(
        'load shopping, then call this again declaring it',
      )
    })

    it('names every unread skill when several are declared', () => {
      expect(outcomeOf({ applicable_skills: ['journal', 'shopping'] }).refusalOrNull()).toBe(
        'load journal, shopping, then call this again declaring it',
      )
    })

    it('names only the unread one when the others are read', () => {
      expect(
        outcomeOf({ applicable_skills: ['journal', 'shopping'] }, ['journal']).refusalOrNull(),
      ).toBe('load shopping, then call this again declaring it')
    })
  })

  // Checked before the session, so a typo is never told to load something that
  // does not exist.
  describe('when the call names a skill the vault does not define', () => {
    it('reports the name as undefined by the vault', () => {
      expect(outcomeOf({ applicable_skills: ['gardening'] })).toBeInstanceOf(
        SkillsNotDefinedByVault,
      )
    })

    it('lists what the vault defines', () => {
      expect(outcomeOf({ applicable_skills: ['gardening'] }).refusalOrNull()).toBe(
        'no skill in this vault is named gardening; this vault defines journal, shopping',
      )
    })

    it('reports the unknown name rather than asking for it to be loaded', () => {
      expect(
        outcomeOf({ applicable_skills: ['journal', 'gardening'] }, ['journal']),
      ).toBeInstanceOf(SkillsNotDefinedByVault)
    })
  })
})
