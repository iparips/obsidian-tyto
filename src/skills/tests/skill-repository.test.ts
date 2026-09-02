import { beforeEach, describe, expect, it } from 'vitest'
import { SkillRepository } from '../skill-repository'
import { FakeAdapter } from '../../test-support/fake-adapter'

const DEFAULT_PATH = '0 - Meta/Skills'

const aSkillFile = (name: string, description: string) =>
  `---\nname: ${name}\ndescription: ${description}\n---\n\nBody.`

describe('SkillRepository', () => {
  let adapter: FakeAdapter

  beforeEach(() => {
    adapter = new FakeAdapter()
  })

  const load = (path = DEFAULT_PATH) => new SkillRepository(adapter.asAdapter(), path).listSkills()

  describe('when the skills directory holds skills', () => {
    beforeEach(() => {
      adapter
        .withSkill(`${DEFAULT_PATH}/tidy-notes`, aSkillFile('tidy-notes', 'Tidies a note.'))
        .withSkill(`${DEFAULT_PATH}/weekly-review`, aSkillFile('weekly-review', 'Reviews a week.'))
    })

    it('builds a catalogue holding every skill when the directory has several', async () => {
      const catalogue = await load()

      expect(catalogue).toEqual([
        {
          name: 'tidy-notes',
          description: 'Tidies a note.',
          path: `${DEFAULT_PATH}/tidy-notes/SKILL.md`,
        },
        {
          name: 'weekly-review',
          description: 'Reviews a week.',
          path: `${DEFAULT_PATH}/weekly-review/SKILL.md`,
        },
      ])
    })
  })

  describe('when a skill file is unusable', () => {
    it('skips a skill file when its frontmatter has no name', async () => {
      adapter.withSkill(`${DEFAULT_PATH}/nameless`, '---\ndescription: Tidies a note.\n---\n')

      const catalogue = await load()

      expect(catalogue).toEqual([])
    })

    it('keeps valid siblings when one skill file is malformed', async () => {
      adapter
        .withSkill(`${DEFAULT_PATH}/broken`, 'No frontmatter here.')
        .withSkill(`${DEFAULT_PATH}/tidy-notes`, aSkillFile('tidy-notes', 'Tidies a note.'))

      const catalogue = await load()

      expect(catalogue.map((skill) => skill.name)).toEqual(['tidy-notes'])
    })

    it('parses a description written as a folded scalar across several lines', async () => {
      adapter.withSkill(
        `${DEFAULT_PATH}/tidy-notes`,
        '---\nname: tidy-notes\ndescription: >-\n  Tidies a note by\n  merging its lists.\n---\n',
      )

      const catalogue = await load()

      expect(catalogue[0].description).toBe('Tidies a note by merging its lists.')
    })
  })

  describe('when a skill body is requested', () => {
    it('returns the file source when the skill exists', async () => {
      adapter.withSkill(`${DEFAULT_PATH}/tidy-notes`, aSkillFile('tidy-notes', 'Tidies.'))
      const loader = new SkillRepository(adapter.asAdapter(), DEFAULT_PATH)
      const [skill] = await loader.listSkills()

      const body = await loader.readBody(skill)

      expect(body).toContain('Body.')
    })

    it('returns null when the skill file has gone', async () => {
      const loader = new SkillRepository(adapter.asAdapter(), DEFAULT_PATH)

      const body = await loader.readBody({ name: 'x', description: '', path: 'missing/SKILL.md' })

      expect(body).toBeNull()
    })
  })

  describe('when discovery finds nothing', () => {
    it('returns an empty catalogue when the skills directory is missing', async () => {
      const catalogue = await load()

      expect(catalogue).toEqual([])
    })

    it('leaves the adapter untouched when the configured path is empty', async () => {
      await load('')

      expect(adapter.listed).toEqual([])
    })
  })

  describe('when settings override the default path', () => {
    it('reads the configured path when settings override the default', async () => {
      adapter.withSkill('Custom/Skills/tidy-notes', aSkillFile('tidy-notes', 'Tidies a note.'))

      const catalogue = await load('Custom/Skills')

      expect(catalogue.map((skill) => skill.path)).toEqual(['Custom/Skills/tidy-notes/SKILL.md'])
    })
  })
})
