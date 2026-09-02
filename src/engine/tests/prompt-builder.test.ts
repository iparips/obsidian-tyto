import { describe, expect, it } from 'vitest'
import { NoteDetails } from '../models/note-details'
import { PromptBuilder } from '../prompt-builder'
import { Skill } from '../../skills/skill'
import { AgentsMdChain } from '../../agents/agents-md-chain'
import { AgentsMdFile } from '../../agents/agents-md-file'
import { AllowedCommand } from '../../commands/models/allowed-command'
// Stored rather than rebuilt: the point is that release 4 did not move a byte
// of the prompt a vault without commands or search sees (NFR8).
import RELEASE_3_PROMPT from './fixtures/release-3-prompt.txt?raw'

const aNote = (): NoteDetails => new NoteDetails('note.md', '# Budget\n\nbody', { line: 2, ch: 0 })

const aSkill = (name: string, description: string): Skill => ({
  name,
  description,
  path: `0 - Meta/Skills/${name}/SKILL.md`,
})

const aChain = (...files: AgentsMdFile[]) => new AgentsMdChain(files)

// The messages carry the prompt; the assertions are about the text inside them.
const standingRulesText = (...args: Parameters<typeof PromptBuilder.standingRules>) =>
  PromptBuilder.standingRules(...args).content

const noteSnapshotText = (note: NoteDetails) => PromptBuilder.noteSnapshot(note).content

describe('PromptBuilder', () => {
  describe('when a folder holds instructions', () => {
    it('labels the block with the folder when one file applies', () => {
      const chain = aChain(new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'))

      const prompt = standingRulesText([], chain)

      expect(prompt).toContain('Instructions from Journal (AGENTS.md):')
    })

    it('labels the block as the vault root when the file sits there', () => {
      const chain = aChain(new AgentsMdFile('', 'AGENTS.md', 'Use full names.'))

      const prompt = standingRulesText([], chain)

      expect(prompt).toContain('Instructions from vault root (AGENTS.md):')
    })

    it('renders the file contents when one file applies', () => {
      const chain = aChain(new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'))

      const prompt = standingRulesText([], chain)

      expect(prompt).toContain('Write in second person.')
    })

    it('states that a later block wins when instructions apply', () => {
      const chain = aChain(new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'))

      const prompt = standingRulesText([], chain)

      expect(prompt).toContain('wins wherever it conflicts with an earlier one')
    })

    it('places the root block before the nearer one when several apply', () => {
      const chain = aChain(
        new AgentsMdFile('', 'AGENTS.md', 'Use full names.'),
        new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'),
      )

      const prompt = standingRulesText([], chain)

      expect(prompt.indexOf('Use full names.')).toBeLessThan(
        prompt.indexOf('Write in second person.'),
      )
    })

    it('places the instructions before the skill catalogue when both apply', () => {
      const chain = aChain(new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'))

      const prompt = standingRulesText([aSkill('todo', 'Archives.')], chain)

      expect(prompt.indexOf('Instructions from Journal')).toBeLessThan(
        prompt.indexOf('This vault defines the skills below'),
      )
    })
  })

  describe('when no folder holds instructions', () => {
    it('omits the instructions section when the chain is empty', () => {
      const prompt = standingRulesText([], new AgentsMdChain())

      expect(prompt).not.toContain('standing instructions below')
    })

    it('produces the same prompt when the chain is omitted entirely', () => {
      const prompt = standingRulesText([])

      expect(prompt).toBe(standingRulesText([], new AgentsMdChain()))
    })
  })

  describe('when the catalogue has entries', () => {
    const catalogue = [aSkill('tidy-notes', 'Tidies a note.'), aSkill('weekly-review', 'Reviews.')]

    it('lists one line per skill when the catalogue has entries', () => {
      const prompt = standingRulesText(catalogue)

      expect(prompt).toContain('tidy-notes - Tidies a note.')
      expect(prompt).toContain('weekly-review - Reviews.')
    })

    it('states the single-note rule when the catalogue has entries', () => {
      const prompt = standingRulesText(catalogue)

      expect(prompt).toContain(PromptBuilder.skillRules())
    })

    it('omits the note content when the prompt is built', () => {
      const prompt = standingRulesText(catalogue)

      expect(prompt).not.toContain('Note path:')
    })
  })

  describe('when the model reports on its work', () => {
    it('forbids claiming an edit that no tool call made when the prompt is built', () => {
      const prompt = standingRulesText()

      expect(prompt).toContain('Only claim an edit you actually made')
    })

    it('states the single-note limit and the absent undo when the prompt is built', () => {
      const prompt = standingRulesText()

      expect(prompt).toContain('no undo tool')
    })
  })

  describe('when the note holds checkboxes', () => {
    it('states that checking an item is an edit when the prompt is built', () => {
      const prompt = standingRulesText()

      expect(prompt).toContain('- [x]')
    })

    it('states that plain bullets are left alone when the prompt is built', () => {
      const prompt = standingRulesText()

      expect(prompt).toContain('plain bullets')
    })
  })

  describe('when the vault defines skills', () => {
    const catalogue = [aSkill('todo', 'Archives ticked items.')]

    it('tells the model to load a skill before following it when skills exist', () => {
      const prompt = standingRulesText(catalogue)

      expect(prompt).toContain('Call load_skill')
    })
  })

  describe('when the catalogue is empty', () => {
    it('omits the skills section when the catalogue is empty', () => {
      const prompt = standingRulesText([])

      expect(prompt).not.toContain('This vault defines the skills below')
    })

    it('produces the same prompt when the catalogue is omitted entirely', () => {
      const prompt = standingRulesText()

      expect(prompt).toBe(standingRulesText([]))
    })
  })

  describe('when the vault allows commands', () => {
    const catalogue = [
      new AllowedCommand('daily-notes:goto-today', 'Open todays daily note'),
      new AllowedCommand('shopping:add', 'Add to shopping list'),
    ]

    it('lists one line per command when the catalogue has entries', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue)

      expect(prompt).toContain('daily-notes:goto-today - Open todays daily note')
      expect(prompt).toContain('shopping:add - Add to shopping list')
    })

    it('tells the model to decline a command it cannot identify when commands exist', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue)

      expect(prompt).toContain('Decline a command whose effect you cannot determine')
    })

    it('tells the model to say so when no command reaches a named destination', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue)

      expect(prompt).toContain('rather than')
      expect(prompt).toContain('searching the vault for it')
    })
  })

  describe('when the vault allows no commands', () => {
    it('omits the command section when the catalogue is empty', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), [])

      expect(prompt).not.toContain('You can run the Obsidian commands below')
    })

    it('produces the release 3 prompt when commands and search are absent', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), [], false)

      expect(prompt).toBe(RELEASE_3_PROMPT)
    })
  })

  describe('when search is enabled', () => {
    const withSearch = () => standingRulesText([], new AgentsMdChain(), [], true)

    it('states that a search never changes the edited note when search is enabled', () => {
      expect(withSearch()).toContain('Searching never changes')
    })

    it('states that an empty search is reported rather than answered', () => {
      expect(withSearch()).toContain('When a search finds nothing, say so.')
    })
  })

  describe('when search is disabled', () => {
    it('omits the search section when search is disabled', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), [], false)

      expect(prompt).not.toContain('You can search the vault')
    })
  })

  describe('when the note snapshot is built', () => {
    it('names the note path when the snapshot is built', () => {
      expect(noteSnapshotText(aNote())).toContain('Note path: note.md')
    })

    it('names the cursor line when the snapshot is built', () => {
      expect(noteSnapshotText(aNote())).toContain('Cursor line: 2')
    })

    it('carries the note content when the snapshot is built', () => {
      expect(noteSnapshotText(aNote())).toContain('# Budget')
    })

    it('states that it supersedes earlier copies when the snapshot is built', () => {
      expect(noteSnapshotText(aNote())).toContain('supersedes any')
    })

    it('keeps the note out of the standing rules when both are built', () => {
      expect(standingRulesText()).not.toContain('Note path:')
    })
  })
})
