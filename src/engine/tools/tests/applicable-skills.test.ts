import { describe, expect, it } from 'vitest'
import { ApplicableSkillsFactory, NoSkillsArgumentSent, SkillsDeclared } from '../applicable-skills'
import { aToolCall } from '../../../test-support/builders'

const applicableSkillsOf = (args: Record<string, unknown>) =>
  ApplicableSkillsFactory.from(aToolCall('insert_at', args))

describe('ApplicableSkillsFactory', () => {
  // An omitted argument and a declared [] both read as an empty array, and they
  // are different claims: one names no skill, the other answers nothing.
  describe('when the call sends no argument', () => {
    it('reports no argument sent when the argument is absent', () => {
      expect(applicableSkillsOf({ location: 'note_end' })).toBeInstanceOf(NoSkillsArgumentSent)
    })

    it('reports no argument sent when the argument is not an array', () => {
      expect(applicableSkillsOf({ applicable_skills: 'journal' })).toBeInstanceOf(
        NoSkillsArgumentSent,
      )
    })

    it('answers nothing, so a caller cannot read it as declaring none', () => {
      expect(applicableSkillsOf({ location: 'note_end' }).arePresent()).toBe(false)
    })
  })

  describe('when the call sends the argument', () => {
    it('reports the question answered when the list is empty', () => {
      expect(applicableSkillsOf({ applicable_skills: [] })).toBeInstanceOf(SkillsDeclared)
    })

    it('holds no names when the list is empty', () => {
      expect(new SkillsDeclared([]).names).toEqual([])
    })

    it('holds the names the call declared', () => {
      const declared = applicableSkillsOf({ applicable_skills: ['journal', 'shopping'] })

      expect(declared.arePresent() && declared.names).toEqual(['journal', 'shopping'])
    })

    it('drops an entry that is not a string, since a name it cannot read is no name', () => {
      const declared = applicableSkillsOf({ applicable_skills: ['journal', 7] })

      expect(declared.arePresent() && declared.names).toEqual(['journal'])
    })
  })
})
