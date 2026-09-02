import { describe, expect, it } from 'vitest'
import { SkillFrontmatterParser } from '../skill-frontmatter'

describe('SkillFrontmatterParser', () => {
  describe('when the frontmatter is well formed', () => {
    it('reads both keys when the description is a plain scalar', () => {
      const source = '---\nname: tidy-notes\ndescription: Tidies a note.\n---\n\nBody.'

      const parsed = SkillFrontmatterParser.parse(source)

      expect(parsed).toEqual({ name: 'tidy-notes', description: 'Tidies a note.' })
    })

    it('joins the lines when the description is a folded scalar', () => {
      const source =
        '---\nname: tidy-notes\ndescription: >-\n  Tidies a note by\n  merging its lists.\n---\n'

      const parsed = SkillFrontmatterParser.parse(source)

      expect(parsed).toEqual({
        name: 'tidy-notes',
        description: 'Tidies a note by merging its lists.',
      })
    })

    it('stops the folded scalar when the next key begins', () => {
      const source = '---\ndescription: >-\n  Tidies a note.\nname: tidy-notes\n---\n'

      const parsed = SkillFrontmatterParser.parse(source)

      expect(parsed).toEqual({ name: 'tidy-notes', description: 'Tidies a note.' })
    })
  })

  describe('when the frontmatter is unusable', () => {
    it('returns null when the file has no frontmatter block', () => {
      const parsed = SkillFrontmatterParser.parse('# Tidy notes\n\nBody.')

      expect(parsed).toBeNull()
    })

    it('returns null when the block carries no name', () => {
      const parsed = SkillFrontmatterParser.parse('---\ndescription: Tidies a note.\n---\n')

      expect(parsed).toBeNull()
    })

    it('returns an empty description when the block carries no description', () => {
      const parsed = SkillFrontmatterParser.parse('---\nname: tidy-notes\n---\n')

      expect(parsed).toEqual({ name: 'tidy-notes', description: '' })
    })
  })
})
