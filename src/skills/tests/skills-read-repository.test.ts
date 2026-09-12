import { beforeEach, describe, expect, it } from 'vitest'
import { SkillsReadRepository } from '../skills-read-repository'

describe('SkillsReadRepository', () => {
  let skillsRead: SkillsReadRepository

  beforeEach(() => {
    skillsRead = new SkillsReadRepository()
  })

  describe('when a skill has been read', () => {
    it('knows the name once it is recorded', () => {
      skillsRead.record('journal')

      expect(skillsRead.has('journal')).toBe(true)
    })

    it('records a name once when it is recorded twice', () => {
      skillsRead.record('journal')
      skillsRead.record('journal')

      expect(skillsRead.has('journal')).toBe(true)
    })
  })

  describe('when a skill has not been read', () => {
    it('does not know a name nothing recorded', () => {
      expect(skillsRead.has('journal')).toBe(false)
    })

    it('does not know a name another recording missed', () => {
      skillsRead.record('journal')

      expect(skillsRead.has('shopping-list')).toBe(false)
    })
  })
})
