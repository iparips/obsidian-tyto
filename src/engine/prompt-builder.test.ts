import { describe, expect, it } from 'vitest'
import { NoteContext, PromptBuilder } from './prompt-builder'
import { Skill } from '../skills/skill-catalogue'

const aNote = (): NoteContext => ({ path: 'note.md', content: '# Budget\n\nbody', cursorLine: 2 })

const aSkill = (name: string, description: string): Skill => ({
  name,
  description,
  path: `0 - Meta/Skills/${name}/SKILL.md`,
})

describe('PromptBuilder', () => {
  describe('when the catalogue has entries', () => {
    const catalogue = [aSkill('tidy-notes', 'Tidies a note.'), aSkill('weekly-review', 'Reviews.')]

    it('lists one line per skill when the catalogue has entries', () => {
      const prompt = PromptBuilder.build(aNote(), catalogue)

      expect(prompt).toContain('tidy-notes - Tidies a note.')
      expect(prompt).toContain('weekly-review - Reviews.')
    })

    it('states the single-note rule when the catalogue has entries', () => {
      const prompt = PromptBuilder.build(aNote(), catalogue)

      expect(prompt).toContain(PromptBuilder.skillRules())
    })

    it('keeps the skills section above the note context when the catalogue has entries', () => {
      const prompt = PromptBuilder.build(aNote(), catalogue)

      expect(prompt.indexOf('tidy-notes -')).toBeLessThan(prompt.indexOf('Note path:'))
    })
  })

  describe('when the catalogue is empty', () => {
    it('omits the skills section when the catalogue is empty', () => {
      const prompt = PromptBuilder.build(aNote(), [])

      expect(prompt).not.toContain('This vault defines the skills below')
    })

    it('produces the same prompt when the catalogue is omitted entirely', () => {
      const prompt = PromptBuilder.build(aNote())

      expect(prompt).toBe(PromptBuilder.build(aNote(), []))
    })
  })
})
