import { describe, expect, it } from 'vitest'
import { ApplicableSkills } from '../applicable-skills'
import { aToolCall } from '../../../test-support/builders'

const applicableSkillsOf = (args: Record<string, unknown>) =>
  ApplicableSkills.from(aToolCall('insert_at', args))

describe('ApplicableSkills', () => {
  // An omitted argument and a declared [] both read as an empty array, and they
  // are different claims: one names no skill, the other answers nothing.
  describe('when the call sends no argument', () => {
    it('reports itself undeclared when the argument is absent', () => {
      expect(applicableSkillsOf({ location: 'note_end' }).declared).toBe(false)
    })

    it('reports itself undeclared when the argument is not an array', () => {
      expect(applicableSkillsOf({ applicable_skills: 'journal' }).declared).toBe(false)
    })
  })

  describe('when the call sends the argument', () => {
    it('reports itself declared when the list is empty', () => {
      expect(applicableSkillsOf({ applicable_skills: [] }).declared).toBe(true)
    })

    it('holds the names the call declared', () => {
      expect(applicableSkillsOf({ applicable_skills: ['journal', 'shopping'] }).names).toEqual([
        'journal',
        'shopping',
      ])
    })

    it('drops an entry that is not a string, since a name it cannot read is no name', () => {
      expect(applicableSkillsOf({ applicable_skills: ['journal', 7] }).names).toEqual(['journal'])
    })
  })
})
