import { describe, expect, it } from 'vitest'
import { NoteContext } from '../models/note-context'
import { PromptBuilder } from '../prompt-builder'
import { Skill } from '../../skills/skill'
import { AgentsMdChain } from '../../agents/agents-md-chain'
import { AgentsMdFile } from '../../agents/agents-md-file'

const aNote = (): NoteContext => new NoteContext('note.md', '# Budget\n\nbody', { line: 2, ch: 0 })

const aSkill = (name: string, description: string): Skill => ({
  name,
  description,
  path: `0 - Meta/Skills/${name}/SKILL.md`,
})

const aChain = (...files: AgentsMdFile[]) => new AgentsMdChain(files)

describe('PromptBuilder', () => {
  describe('when a folder holds instructions', () => {
    it('labels the block with the folder when one file applies', () => {
      const chain = aChain(new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'))

      const prompt = PromptBuilder.build(aNote(), [], chain)

      expect(prompt).toContain('Instructions from Journal (AGENTS.md):')
    })

    it('labels the block as the vault root when the file sits there', () => {
      const chain = aChain(new AgentsMdFile('', 'AGENTS.md', 'Use full names.'))

      const prompt = PromptBuilder.build(aNote(), [], chain)

      expect(prompt).toContain('Instructions from vault root (AGENTS.md):')
    })

    it('renders the file contents when one file applies', () => {
      const chain = aChain(new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'))

      const prompt = PromptBuilder.build(aNote(), [], chain)

      expect(prompt).toContain('Write in second person.')
    })

    it('states that a later block wins when instructions apply', () => {
      const chain = aChain(new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'))

      const prompt = PromptBuilder.build(aNote(), [], chain)

      expect(prompt).toContain('wins wherever it conflicts with an earlier one')
    })

    it('places the root block before the nearer one when several apply', () => {
      const chain = aChain(
        new AgentsMdFile('', 'AGENTS.md', 'Use full names.'),
        new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'),
      )

      const prompt = PromptBuilder.build(aNote(), [], chain)

      expect(prompt.indexOf('Use full names.')).toBeLessThan(
        prompt.indexOf('Write in second person.'),
      )
    })

    it('places the instructions before the skill catalogue when both apply', () => {
      const chain = aChain(new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'))

      const prompt = PromptBuilder.build(aNote(), [aSkill('todo', 'Archives.')], chain)

      expect(prompt.indexOf('Instructions from Journal')).toBeLessThan(
        prompt.indexOf('This vault defines the skills below'),
      )
    })
  })

  describe('when no folder holds instructions', () => {
    it('omits the instructions section when the chain is empty', () => {
      const prompt = PromptBuilder.build(aNote(), [], new AgentsMdChain())

      expect(prompt).not.toContain('standing instructions below')
    })

    it('produces the same prompt when the chain is omitted entirely', () => {
      const prompt = PromptBuilder.build(aNote(), [])

      expect(prompt).toBe(PromptBuilder.build(aNote(), [], new AgentsMdChain()))
    })
  })

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
