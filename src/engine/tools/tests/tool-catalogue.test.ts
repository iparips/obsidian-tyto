import { describe, expect, it } from 'vitest'
import { ToolCatalogue } from '../tool-schemas'
import { ToolSchema } from '../../../model/providers/types'

const schemaFor = (name: string, skillsExist: boolean): ToolSchema =>
  ToolCatalogue.forCapabilities(true, true, true, skillsExist).find(
    (schema) => schema.name === name,
  ) as ToolSchema

const declaresSkills = (name: string, skillsExist: boolean) =>
  schemaFor(name, skillsExist).parameters.required.includes('applicable_skills')

const namesOffered = (searchEnabled: boolean) =>
  ToolCatalogue.forCapabilities(true, searchEnabled, true, false).map((schema) => schema.name)

describe('ToolCatalogue', () => {
  describe('when searching is on', () => {
    it('offers list_tags', () => {
      expect(namesOffered(true)).toContain('list_tags')
    })
  })

  describe('when searching is off', () => {
    it('omits list_tags, as it omits the other search tools', () => {
      expect(namesOffered(false)).not.toContain('list_tags')
    })
  })

  describe('when the vault defines skills', () => {
    it.each(['run_command', 'glob_notes', 'grep_notes', 'read_note'])(
      'requires applicable_skills on %s, which opens vault access',
      (name) => {
        expect(declaresSkills(name, true)).toBe(true)
      },
    )

    it.each(['replace_text', 'insert_text', 'insert_at'])(
      'requires applicable_skills on %s, which writes to the note',
      (name) => {
        expect(declaresSkills(name, true)).toBe(true)
      },
    )

    // The search that found its path was guarded already, so asking again would
    // spend a round trip on a question the turn has answered.
    it('leaves open_note without the argument, since the search that found its path was guarded', () => {
      expect(declaresSkills('open_note', true)).toBe(false)
    })

    // The phrase it reads is what tells the model which skill the turn needs, so
    // gating it would ask the question blind.
    it('leaves resolve_date without the argument, since it reaches no vault', () => {
      expect(declaresSkills('resolve_date', true)).toBe(false)
    })

    // It takes no path and covers the whole vault, so a skill has nothing to
    // say about it.
    it('leaves list_tags without the argument, since it reaches no path', () => {
      expect(declaresSkills('list_tags', true)).toBe(false)
    })

    it('describes the argument, so the model knows an empty list is an answer', () => {
      const property = schemaFor('insert_at', true).parameters.properties[
        'applicable_skills'
      ] as Record<string, unknown>

      expect(property.description).toContain('[] when none covers it')
    })
  })

  // A vault defining none is offered the release 3 schemas unchanged.
  describe('when the vault defines no skills', () => {
    it.each(['run_command', 'glob_notes', 'grep_notes', 'read_note', 'insert_at'])(
      'omits applicable_skills from %s',
      (name) => {
        expect(declaresSkills(name, false)).toBe(false)
      },
    )

    it('leaves the properties of a guarded tool untouched', () => {
      expect(Object.keys(schemaFor('insert_at', false).parameters.properties)).toEqual([
        'location',
        'content',
      ])
    })
  })
})
