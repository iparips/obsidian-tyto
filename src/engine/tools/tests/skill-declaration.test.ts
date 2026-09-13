import { describe, expect, it } from 'vitest'
import { SkillDeclaration } from '../skill-declaration'
import { Skill } from '../../../skills/skill'
import { aToolCall } from '../../../test-support/builders'

const JOURNAL = new Skill('journal', 'Writes the daily note.', 'Skills/journal.md')
const SHOPPING = new Skill('shopping', 'Keeps the list.', 'Skills/shopping.md')
const VAULT_SKILLS = [JOURNAL, SHOPPING]

const refusalFor = (args: Record<string, unknown>, read: readonly string[] = []) =>
  SkillDeclaration.from(aToolCall('insert_at', args)).getRefusalAgainstVaultAndSession(
    VAULT_SKILLS,
    (name) => read.includes(name),
  )

describe('SkillDeclaration', () => {
  describe('when the call declares nothing', () => {
    // An omitted argument and a declared [] both read as an empty array through
    // stringsArgument, and they are different claims.
    it('refuses a call that sends no argument at all', () => {
      expect(refusalFor({ location: 'note_end' })).toBe(SkillDeclaration.MISSING_ARGUMENT)
    })

    it('refuses a call whose argument is not an array', () => {
      expect(refusalFor({ applicable_skills: 'journal' })).toBe(SkillDeclaration.MISSING_ARGUMENT)
    })

    it('allows a call declaring that no skill covers the utterance', () => {
      expect(refusalFor({ applicable_skills: [] })).toBeNull()
    })
  })

  describe('when the call names a skill the vault defines', () => {
    it('allows a name the session has read', () => {
      expect(refusalFor({ applicable_skills: ['journal'] }, ['journal'])).toBeNull()
    })

    it('names the skill to load when nothing has read it', () => {
      expect(refusalFor({ applicable_skills: ['journal'] })).toBe(
        'load journal, then call this again declaring it',
      )
    })

    // Reading one skill does not license another: the gate asks which skill, not
    // whether any was read.
    it('names the unread skill when a different one was read', () => {
      expect(refusalFor({ applicable_skills: ['shopping'] }, ['journal'])).toBe(
        'load shopping, then call this again declaring it',
      )
    })

    it('names every unread skill when several are declared', () => {
      expect(refusalFor({ applicable_skills: ['journal', 'shopping'] })).toBe(
        'load journal, shopping, then call this again declaring it',
      )
    })

    it('names only the unread one when the others are read', () => {
      expect(refusalFor({ applicable_skills: ['journal', 'shopping'] }, ['journal'])).toBe(
        'load shopping, then call this again declaring it',
      )
    })
  })

  describe('when the call names a skill the vault does not define', () => {
    // Answered with the real names, so a model that guessed does not search for
    // the list it was already sent.
    it('lists what the vault defines', () => {
      expect(refusalFor({ applicable_skills: ['gardening'] })).toBe(
        'no skill in this vault is named gardening; this vault defines journal, shopping',
      )
    })

    // Checked before the session record: a typo told to load something that does
    // not exist is a refusal the model cannot answer.
    it('reports the unknown name rather than asking for it to be loaded', () => {
      expect(refusalFor({ applicable_skills: ['journal', 'gardening'] }, ['journal'])).toBe(
        'no skill in this vault is named gardening; this vault defines journal, shopping',
      )
    })
  })
})
