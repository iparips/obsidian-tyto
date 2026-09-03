import { describe, expect, it } from 'vitest'
import { NoteDetails } from '../models/note-details'
import { Today } from '../models/today'
import { PromptBuilder } from '../prompt-builder'
import { Skill } from '../../skills/skill'
import { AgentsMdChain } from '../../agents/agents-md-chain'
import { AgentsMdFile } from '../../agents/agents-md-file'
import { AllowedCommand } from '../../commands/models/allowed-command'
// Stored rather than rebuilt, so a change to the prompt a vault without commands
// or search sees is deliberate rather than drift. Release 4 moved none of it;
// release 5 adds the heading rule and re-records this.
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

    // The list travels with the note snapshot rather than the standing rules,
    // so the trigger phrases sit in the freshest position rather than behind
    // the whole chat history and the note body.
    it('lists one line per skill beside the note, where the model reads last', () => {
      const snapshot = PromptBuilder.noteSnapshot(aNote(), Today.of(), catalogue).content

      expect(snapshot).toContain('tidy-notes - Tidies a note.')
      expect(snapshot).toContain('weekly-review - Reviews.')
    })

    it('names no skill in the standing rules, since the list moved to the note', () => {
      expect(standingRulesText(catalogue)).not.toContain('tidy-notes - Tidies a note.')
    })

    it('keeps the rules in the standing rules, since how a skill works is fixed', () => {
      expect(standingRulesText(catalogue)).toContain('This vault defines the skills below')
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

    // A command opened the right note, so the edit looked like success and the
    // skill's own steps were skipped without anything saying so.
    it('tells the model to answer the skill question before its first edit', () => {
      const prompt = standingRulesText(catalogue)

      expect(prompt).toContain('Answer the skill question before your first edit')
    })

    it('names no_skill_applies, so the model is never stuck when none fits', () => {
      const prompt = standingRulesText(catalogue)

      expect(prompt).toContain('no_skill_applies when none does')
    })

    it('says the model decides which skill applies, not the harness', () => {
      const prompt = standingRulesText(catalogue)

      expect(prompt).toContain('You decide which applies')
    })

    it('tells the model the summary says when a skill applies, not how to do it', () => {
      const prompt = standingRulesText(catalogue)

      expect(prompt).toContain('never how to carry it out')
    })

    // A skill saying "MUST load before editing any file under the journal root"
    // was declined as "no skill for opening a dated note", for a note under
    // that root.
    it('tells the model a MUST-load skill is not a judgement call', () => {
      const prompt = standingRulesText(catalogue)

      expect(prompt).toContain('is not a judgement call')
    })

    it('tells the model the note it is about to edit can be the match', () => {
      const prompt = standingRulesText(catalogue)

      expect(prompt).toContain('whatever words the user used')
    })

    it('tells the model to write under a heading the note already has', () => {
      expect(standingRulesText([])).toContain('Write under a heading the note already has')
    })

    it('tells the model loose wording still names the same section', () => {
      expect(standingRulesText([])).toContain('do not make it a different section')
    })

    it('tells the model that reaching the note is not doing the work', () => {
      const prompt = standingRulesText(catalogue)

      expect(prompt).toContain('Reaching the right note is not the same as doing the work.')
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

    it('tells the model to prefer a listed command that opens the destination', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue)

      expect(prompt).toContain('prefer a listed command that opens it')
    })

    it('tells the model a command only opens the note, so a matched skill still leads', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue)

      expect(prompt).toContain('A command only opens the note.')
    })

    it('tells the model to search only when no command reaches the destination', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue)

      expect(prompt).toContain(
        'Search for the note only when no listed command reaches it, then open what you found.',
      )
    })

    it('states the preference identically whichever mode is on, since the mode is not in the prompt', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue)

      expect(prompt).not.toContain('confirm')
    })

    it('tells the model to ask only when no command and no search resolves the destination', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue)

      expect(prompt).toContain(
        'Ask only when no listed command and no search resolves what the instruction named:',
      )
    })

    it('tells the model to offer suggestions when the answer is not a note', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue)

      expect(prompt).toContain('Offer suggestions when the answer is not a note')
    })

    // Asking which of several notes the user meant is what choose_note is for.
    // Left in the question rules, it routes the model to ask in prose, which is
    // the second question 14-choosing-the-note exists to remove.
    it('tells the model never to ask which of several notes the user meant', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue)

      expect(prompt).toContain('Never ask which of several notes the user meant.')
    })

    it('names several matching notes nowhere as a reason to ask, since choosing covers it', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), catalogue)

      expect(prompt).not.toContain('when several notes match equally')
    })
  })

  describe('when the vault allows no commands', () => {
    it('omits the command section when the catalogue is empty', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), [])

      expect(prompt).not.toContain('You can run the Obsidian commands below')
    })

    it('omits the question section when no route exists to exhaust', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), [], false)

      expect(prompt).not.toContain('You can ask the user one question')
    })

    it('keeps the question section when search alone is available', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), [], true)

      expect(prompt).toContain('You can ask the user one question')
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

    it('states the order to try when search is enabled', () => {
      expect(withSearch()).toContain('Reach a note in this order:')
    })

    it('tells the model to glob before guessing a filename', () => {
      expect(withSearch()).toContain('Never spell out a date or title you have not seen')
    })

    it('mentions search_vault nowhere, since it no longer exists', () => {
      expect(withSearch()).not.toContain('search_vault')
    })

    it('states choosing in the order to try, between grepping and opening', () => {
      expect(withSearch()).toContain('offer what you found with choose_note; open what the user')
    })

    it('tells the model one candidate is still the user to offer', () => {
      expect(withSearch()).toContain('Offer even a single candidate:')
    })

    it('tells the model to open no note the user has not picked', () => {
      expect(withSearch()).toContain('Never open a note the user has not picked.')
    })

    it('tells the model to ask what they meant only after a shortlist is declined', () => {
      expect(withSearch()).toContain(
        'Only after the user declines every note you offered, ask what they meant',
      )
    })

    // The decline rule once ended "searching again spends the turn", unbound to
    // the decline. Read as a standing rule, it told the model searching was
    // costly and it asked rather than searched.
    it('never calls searching a cost, so the model does not ask rather than search', () => {
      expect(withSearch()).not.toContain('spends the turn')
    })

    it('tells the model to search before asking where a note is', () => {
      expect(withSearch()).toContain('Search before you ask.')
    })

    // The model was refused an unchosen open, then asked the user in prose for
    // permission they had already given by asking. The refusal names the tool;
    // the prompt has to say that asking is not the alternative.
    it('tells the model to call choose_note when an open is refused as unchosen', () => {
      expect(withSearch()).toContain('Call choose_note with that path and')
    })

    it('tells the model a refused open is not a request for permission', () => {
      expect(withSearch()).toContain('not telling you to ask the user in prose')
    })

    // Week-* matched nothing, because a glob matches notes and Week-35 is a
    // folder. The rule that produced it said only "ends in *".
    it('tells the model its first glob ends in a slash-star, not a partial name', () => {
      expect(withSearch()).toContain(
        'A glob matches notes, never folders. Listing a folder ends in /*.',
      )
    })
  })

  describe('when the model might ask instead of acting', () => {
    // A turn globbed Week-*/Week-*.md, then walked archived week folders and
    // asked the user which week held a date it had already resolved.
    it('tells the model to glob for the file once it knows the name', () => {
      expect(standingRulesText([], new AgentsMdChain(), [], true)).toContain(
        'Name the file, not the folder.',
      )
    })

    it('tells the model never to ask which folder or week a note is in', () => {
      expect(standingRulesText([], new AgentsMdChain(), [], true)).toContain(
        'which folder holds it, or',
      )
    })

    it('tells the model to read what two globs returned rather than glob again', () => {
      expect(standingRulesText([], new AgentsMdChain(), [], true)).toContain(
        'Two globs that returned notes are enough.',
      )
    })

    it('tells the model a glob matches notes rather than folders', () => {
      expect(standingRulesText([], new AgentsMdChain(), [], true)).toContain(
        'A glob matches notes, never folders.',
      )
    })

    const withCommands = () =>
      standingRulesText([], new AgentsMdChain(), [
        new AllowedCommand('daily-notes:goto-today', 'Open todays daily note'),
      ])

    it('tells the model never to ask permission for what the user already asked for', () => {
      expect(withCommands()).toContain(
        'Never ask permission to do what the user already asked for.',
      )
    })

    it('tells the model choose_note is the check, not a question written in prose', () => {
      expect(withCommands()).toContain('it is not a question you write in prose')
    })

    it('mentions the retired confirmation nowhere, since that mechanism is gone', () => {
      expect(standingRulesText([], new AgentsMdChain(), [], true)).not.toContain('confirm')
    })
  })

  describe('when search is disabled', () => {
    it('omits the search section when search is disabled', () => {
      const prompt = standingRulesText([], new AgentsMdChain(), [], false)

      expect(prompt).not.toContain('Reach a note in this order:')
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

  describe('when the prompt states what day it is', () => {
    const THURSDAY = new Today(new Date(2026, 8, 3))

    it('names today in the note snapshot when a note is open', () => {
      const snapshot = PromptBuilder.noteSnapshot(aNote(), THURSDAY)

      expect(snapshot.content).toContain('Today is 2026-09-03 (Thursday).')
    })

    it('names today in the unbound snapshot when no note is open', () => {
      const snapshot = PromptBuilder.noNoteSnapshot(false, THURSDAY)

      expect(snapshot.content).toContain('Today is 2026-09-03 (Thursday).')
    })

    it('tells the model not to resolve a date against a note name', () => {
      const snapshot = PromptBuilder.noteSnapshot(aNote(), THURSDAY)

      expect(snapshot.content).toContain(
        'A note named for a date is not\nevidence of what today is.',
      )
    })

    it('states the date before the note, so it is read as context for it', () => {
      const snapshot = PromptBuilder.noteSnapshot(aNote(), THURSDAY)

      expect(snapshot.content.indexOf('Today is')).toBeLessThan(
        snapshot.content.indexOf('Note path:'),
      )
    })

    it('keeps the note content when the date is added', () => {
      const snapshot = PromptBuilder.noteSnapshot(aNote(), THURSDAY)

      expect(snapshot.content).toContain('# Budget')
    })
  })
})
