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

const noNoteSnapshotText = (canRunCommands = false) =>
  PromptBuilder.noNoteSnapshot(canRunCommands).content

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

  describe('when the session is unbound', () => {
    it('states that no note is open when the session is unbound', () => {
      expect(noNoteSnapshotText()).toContain('No note is open')
    })

    it('says the other tools still work when the session is unbound', () => {
      expect(noNoteSnapshotText()).toContain('Every tool but the editing ones still works')
    })

    it('asks the user to open a note when no command reaches one', () => {
      expect(noNoteSnapshotText()).toContain('ask them to open one')
    })

    it('tells the model not to call an editing tool when no command reaches a note', () => {
      expect(noNoteSnapshotText()).toContain('rather than calling an editing tool')
    })

    it('runs the command that opens the note when a command is allowed', () => {
      expect(noNoteSnapshotText(true)).toContain('run the command that opens the note they named')
    })

    it('asks only as a last resort when a command is allowed', () => {
      expect(noNoteSnapshotText(true)).toContain(
        'Only ask them to open a note if no listed command',
      )
    })

    it('does not tell the model to ask first when a command is allowed', () => {
      expect(noNoteSnapshotText(true)).not.toContain('rather than calling an editing tool')
    })

    it('says the session binds to the first note that opens when it is unbound', () => {
      expect(noNoteSnapshotText()).toContain('binds to the first note that opens')
    })

    it('names no note when the session is unbound', () => {
      expect(noNoteSnapshotText()).not.toContain('Note path:')
    })

    it('leaves the standing rules unchanged when the session is unbound', () => {
      expect(standingRulesText()).not.toContain('No note is open')
    })
  })

  describe('when a tool can reach beyond the open note', () => {
    const catalogue = [new AllowedCommand('daily-notes:goto-today', 'Open today')]

    it('does not claim other files are unreachable when a command is allowed', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue)

      expect(prompt).not.toContain('You cannot read or write any file other than this note')
    })

    it('does not claim other files are unreachable when search is enabled', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), [], true)

      expect(prompt).not.toContain('You cannot read or write any file other than this note')
    })

    it('says a command can open another note when one is allowed', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue)

      expect(prompt).toContain('open another note by running one of the commands listed below')
    })

    it('says search can read other notes when search is enabled', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), [], true)

      expect(prompt).toContain('read other notes by searching the vault')
    })

    it('names both reaches when commands and search are both available', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue, true)

      expect(prompt).toContain('open another note')
      expect(prompt).toContain('read other notes')
    })

    it('keeps the no-undo warning when the reach widens', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue, true)

      expect(prompt).toContain('no undo tool')
    })

    it('tells a skill to run the command rather than decline when one is allowed', () => {
      const skills = [aSkill('todo', 'Manages todo.md files.')]
      const prompt = standingRulesText(skills, new AgentsMdChain(), catalogue)

      expect(prompt).toContain('run the command that opens it')
      expect(prompt).not.toContain('editing other files is not supported yet')
    })

    it('keeps the skill refusal when no command is allowed', () => {
      const skills = [aSkill('todo', 'Manages todo.md files.')]
      const prompt = standingRulesText(skills, new AgentsMdChain(), [])

      expect(prompt).toContain('editing other files is not supported yet')
    })
  })
})
