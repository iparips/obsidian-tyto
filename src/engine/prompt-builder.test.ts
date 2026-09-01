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

    it('omits the note content when the prompt is built', () => {
      const prompt = PromptBuilder.build(aNote(), catalogue)

      expect(prompt).not.toContain('Note path:')
    })
  })

  describe('when the model reports on its work', () => {
    it('forbids claiming an edit that no tool call made when the prompt is built', () => {
      const prompt = PromptBuilder.build(aNote())

      expect(prompt).toContain('Only claim an edit you actually made')
    })

    it('states the single-note limit and the absent undo when the prompt is built', () => {
      const prompt = PromptBuilder.build(aNote())

      expect(prompt).toContain('no undo tool')
    })
  })

  describe('when the note holds checkboxes', () => {
    it('states that checking an item is an edit when the prompt is built', () => {
      const prompt = PromptBuilder.build(aNote())

      expect(prompt).toContain('- [x]')
    })

    it('states that plain bullets are left alone when the prompt is built', () => {
      const prompt = PromptBuilder.build(aNote())

      expect(prompt).toContain('plain bullets')
    })
  })

  describe('when the vault defines skills', () => {
    const catalogue = [aSkill('todo', 'Archives ticked items.')]

    it('tells the model to load a skill before following it when skills exist', () => {
      const prompt = PromptBuilder.build(aNote(), catalogue)

      expect(prompt).toContain('Call load_skill')
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
