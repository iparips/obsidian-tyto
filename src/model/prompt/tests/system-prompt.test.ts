import { describe, expect, it } from 'vitest'
import { NoteDetails } from '../../../engine/note-editing/note-details'
import { Today } from '../../today'
import { SystemPrompt } from '../system-prompt'
import { DateMessage } from '../date-message'
import { NoNoteBoundMessage } from '../no-note-bound-message'
import { NoteContextMessage } from '../note-context-message'
import { SkillSection } from '../system-prompt-sections/skill-section'
import { Skill } from '../../../skills/skill'
import { AgentsMdChain } from '../../../agents/agents-md-chain'
import { AgentsMdFile } from '../../../agents/agents-md-file'
import { AllowedObsidianCommand } from '../../../commands/models/allowed-obsidian-command'
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
const catalogue = [aSkill('tidy-notes', 'Tidies a note.'), aSkill('weekly-review', 'Reviews.')]

const systemPromptText = (...args: Parameters<typeof SystemPrompt.build>) =>
  SystemPrompt.build(...args).content

const noteContextText = (note: NoteDetails) => NoteContextMessage.build(note).content

const unboundContextText = (canRunCommands = false, canSearch = false) =>
  NoNoteBoundMessage.build(canRunCommands, canSearch).content

describe('the prompt messages', () => {
  describe('when a folder holds instructions', () => {
    it('labels the block with the folder when one file applies', () => {
      const chain = aChain(new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'))

      const prompt = systemPromptText(chain)

      expect(prompt).toContain('Instructions from Journal (AGENTS.md):')
    })

    it('labels the block as the vault root when the file sits there', () => {
      const chain = aChain(new AgentsMdFile('', 'AGENTS.md', 'Use full names.'))

      const prompt = systemPromptText(chain)

      expect(prompt).toContain('Instructions from vault root (AGENTS.md):')
    })

    it('renders the file contents when one file applies', () => {
      const chain = aChain(new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'))

      const prompt = systemPromptText(chain)

      expect(prompt).toContain('Write in second person.')
    })

    it('states that a later block wins when instructions apply', () => {
      const chain = aChain(new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'))

      const prompt = systemPromptText(chain)

      expect(prompt).toContain('wins wherever it conflicts with an earlier one')
    })

    it('places the root block before the nearer one when several apply', () => {
      const chain = aChain(
        new AgentsMdFile('', 'AGENTS.md', 'Use full names.'),
        new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'),
      )

      const prompt = systemPromptText(chain)

      expect(prompt.indexOf('Use full names.')).toBeLessThan(
        prompt.indexOf('Write in second person.'),
      )
    })

    it('places the instructions before the skill catalogue when both apply', () => {
      const chain = aChain(new AgentsMdFile('Journal', 'AGENTS.md', 'Write in second person.'))

      const prompt = systemPromptText(chain, [], catalogue)

      expect(prompt.indexOf('Instructions from Journal')).toBeLessThan(
        prompt.indexOf('This vault defines the skills listed below'),
      )
    })
  })

  describe('when no folder holds instructions', () => {
    it('omits the instructions section when the chain is empty', () => {
      const prompt = systemPromptText()

      expect(prompt).not.toContain('standing instructions below')
    })

    it('produces the same prompt when the chain is omitted entirely', () => {
      const prompt = systemPromptText()

      expect(prompt).toBe(systemPromptText())
    })
  })

  describe('when the catalogue has entries', () => {
    // The names sit with the rules that describe them, so neither reads without
    // the other.
    it('lists one line per skill beside the rules', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], catalogue)

      expect(prompt).toContain('tidy-notes - Tidies a note.')
      expect(prompt).toContain('weekly-review - Reviews.')
    })

    it('states the rules above the names they describe', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], catalogue)

      expect(prompt.indexOf('Call load_skill')).toBeLessThan(
        prompt.indexOf('tidy-notes - Tidies a note.'),
      )
    })

    it('names no skill when the vault defines none', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], [])

      expect(prompt).not.toContain('Match the user against these')
    })

    it('names each skill beside the rules, so neither reads without the other', () => {
      expect(systemPromptText(new AgentsMdChain(), [], catalogue)).toContain(
        'tidy-notes - Tidies a note.',
      )
    })

    it('keeps the rules in the standing rules, since how a skill works is fixed', () => {
      expect(systemPromptText(new AgentsMdChain(), [], catalogue)).toContain(
        'This vault defines the skills listed below',
      )
    })

    it('states the single-note rule when the catalogue has entries', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], catalogue)

      expect(prompt).toContain(SkillSection.rules())
    })

    it('omits the note content when the prompt is built', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], catalogue)

      expect(prompt).not.toContain('Note path:')
    })
  })

  describe('when the model reports on its work', () => {
    it('forbids claiming an edit that no tool call made when the prompt is built', () => {
      const prompt = systemPromptText()

      expect(prompt).toContain('Only claim an edit you actually made')
    })

    it('states the single-note limit and the absent undo when the prompt is built', () => {
      const prompt = systemPromptText()

      expect(prompt).toContain('no undo tool')
    })
  })

  describe('when the note holds checkboxes', () => {
    it('states that checking an item is an edit when the prompt is built', () => {
      const prompt = systemPromptText()

      expect(prompt).toContain('- [x]')
    })

    it('states that plain bullets are left alone when the prompt is built', () => {
      const prompt = systemPromptText()

      expect(prompt).toContain('plain bullets')
    })
  })

  describe('when the vault defines skills', () => {
    it('tells the model to load a skill before following it when skills exist', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], catalogue)

      expect(prompt).toContain('Call load_skill')
    })

    // A command opened the right note, so the edit looked like success and the
    // skill's own steps were skipped without anything saying so.
    it('tells the model to answer the skill question before its first edit', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], catalogue)

      expect(prompt).toContain('Answer the skill question before your first edit')
    })

    it('names no_skill_applies, so the model is never stuck when none fits', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], catalogue)

      expect(prompt).toContain('no_skill_applies when none does')
    })

    it('says the model decides which skill applies, not the harness', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], catalogue)

      expect(prompt).toContain('You decide which applies')
    })

    it('tells the model the summary says when a skill applies, not how to do it', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], catalogue)

      expect(prompt).toContain('never how to carry it out')
    })

    // A skill saying "MUST load before editing any file under the journal root"
    // was declined as "no skill for opening a dated note", for a note under
    // that root.
    it('tells the model a MUST-load skill is not a judgement call', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], catalogue)

      expect(prompt).toContain('is not a judgement call')
    })

    it('tells the model the note it is about to edit can be the match', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], catalogue)

      expect(prompt).toContain('whatever words the user used')
    })

    it('tells the model to write under a heading the note already has', () => {
      expect(systemPromptText()).toContain('Write under a heading the note already has')
    })

    it('tells the model loose wording still names the same section', () => {
      expect(systemPromptText()).toContain('do not make it a different section')
    })

    it('tells the model that reaching the note is not doing the work', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], catalogue)

      expect(prompt).toContain('Reaching the right note is not the same as doing the work.')
    })
  })

  describe('when the catalogue is empty', () => {
    it('omits the skills section when the catalogue is empty', () => {
      const prompt = systemPromptText()

      expect(prompt).not.toContain('This vault defines the skills listed below')
    })

    it('produces the same prompt when the catalogue is omitted entirely', () => {
      const prompt = systemPromptText()

      expect(prompt).toBe(systemPromptText())
    })
  })

  describe('when the vault allows commands', () => {
    const catalogue = [
      new AllowedObsidianCommand('daily-notes:goto-today', 'Open todays daily note'),
      new AllowedObsidianCommand('shopping:add', 'Add to shopping list'),
    ]

    it('lists one line per command when the catalogue has entries', () => {
      const prompt = systemPromptText(new AgentsMdChain(), catalogue)

      expect(prompt).toContain('daily-notes:goto-today - Open todays daily note')
      expect(prompt).toContain('shopping:add - Add to shopping list')
    })

    it('tells the model to decline a command it cannot identify when commands exist', () => {
      const prompt = systemPromptText(new AgentsMdChain(), catalogue)

      expect(prompt).toContain('Decline a command whose effect you cannot determine')
    })

    it('tells the model to prefer a listed command that opens the destination', () => {
      const prompt = systemPromptText(new AgentsMdChain(), catalogue)

      expect(prompt).toContain('prefer a listed command that opens it')
    })

    it('tells the model a command only opens the note, so a matched skill still leads', () => {
      const prompt = systemPromptText(new AgentsMdChain(), catalogue)

      expect(prompt).toContain('A command only opens the note.')
    })

    it('tells the model to search only when no command reaches the destination', () => {
      const prompt = systemPromptText(new AgentsMdChain(), catalogue)

      expect(prompt).toContain(
        'Search for the note only when no listed command reaches it, then open what you found.',
      )
    })

    it('states the preference identically whichever mode is on, since the mode is not in the prompt', () => {
      const prompt = systemPromptText(new AgentsMdChain(), catalogue)

      expect(prompt).not.toContain('confirm')
    })

    it('tells the model to ask only when no command and no search resolves the destination', () => {
      const prompt = systemPromptText(new AgentsMdChain(), catalogue)

      expect(prompt).toContain(
        'Ask only when no listed command and no search resolves what the instruction named:',
      )
    })

    it('tells the model to offer suggestions when the answer is not a note', () => {
      const prompt = systemPromptText(new AgentsMdChain(), catalogue)

      expect(prompt).toContain('Offer suggestions when the answer is not a note')
    })

    // Asking which of several notes the user meant is what choose_note is for.
    // Left in the question rules, it routes the model to ask in prose, which is
    // the second question 14-choosing-the-note exists to remove.
    it('tells the model never to ask which of several notes the user meant', () => {
      const prompt = systemPromptText(new AgentsMdChain(), catalogue)

      expect(prompt).toContain('Never ask which of several notes the user meant.')
    })

    it('names several matching notes nowhere as a reason to ask, since choosing covers it', () => {
      const prompt = systemPromptText(new AgentsMdChain(), catalogue)

      expect(prompt).not.toContain('when several notes match equally')
    })
  })

  describe('when the vault allows no commands', () => {
    it('omits the command section when the catalogue is empty', () => {
      const prompt = systemPromptText()

      expect(prompt).not.toContain('You can run the Obsidian commands below')
    })

    it('omits the question section when no route exists to exhaust', () => {
      const prompt = systemPromptText()

      expect(prompt).not.toContain('You can ask the user one question')
    })

    it('keeps the question section when search alone is available', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], [], true)

      expect(prompt).toContain('You can ask the user one question')
    })

    it('produces the release 3 prompt when commands and search are absent', () => {
      const prompt = systemPromptText()

      expect(prompt).toBe(RELEASE_3_PROMPT)
    })
  })

  describe('when search is enabled', () => {
    const withSearch = () => systemPromptText(new AgentsMdChain(), [], [], true)

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
      expect(systemPromptText(new AgentsMdChain(), [], [], true)).toContain(
        'Name the file, not the folder.',
      )
    })

    it('tells the model never to ask which folder or week a note is in', () => {
      expect(systemPromptText(new AgentsMdChain(), [], [], true)).toContain(
        'which folder holds it, or',
      )
    })

    // A budget says how many calls are left; a stop condition says what to do
    // with the note already in hand. The reported turn globbed three more times
    // after the fourth call had returned the right note.
    it('tells the model a glob that found notes ends the search', () => {
      expect(systemPromptText(new AgentsMdChain(), [], [], true)).toContain(
        'A glob that returned notes has answered the question. Offer what it found',
      )
    })

    it('holds a later glob to a format a listing already returned', () => {
      expect(systemPromptText(new AgentsMdChain(), [], [], true)).toContain(
        'their names are the vault format',
      )
    })

    it('tells the model a glob matches notes rather than folders', () => {
      expect(systemPromptText(new AgentsMdChain(), [], [], true)).toContain(
        'A glob matches notes, never folders.',
      )
    })

    const withCommands = () =>
      systemPromptText(new AgentsMdChain(), [
        new AllowedObsidianCommand('daily-notes:goto-today', 'Open todays daily note'),
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
      expect(systemPromptText(new AgentsMdChain(), [], [], true)).not.toContain('confirm')
    })
  })

  describe('when search is disabled', () => {
    it('omits the search section when search is disabled', () => {
      const prompt = systemPromptText()

      expect(prompt).not.toContain('Reach a note in this order:')
    })
  })

  describe('when the final context carries a note', () => {
    it('names the note path when the final context carries a note', () => {
      expect(noteContextText(aNote())).toContain('Note path: note.md')
    })

    it('names the cursor line when the final context carries a note', () => {
      expect(noteContextText(aNote())).toContain('Cursor line: 2')
    })

    it('carries the note content when the final context carries a note', () => {
      expect(noteContextText(aNote())).toContain('# Budget')
    })

    it('states that it supersedes earlier copies when the final context carries a note', () => {
      expect(noteContextText(aNote())).toContain('supersedes any')
    })

    it('keeps the note out of the standing rules when both are built', () => {
      expect(systemPromptText()).not.toContain('Note path:')
    })
  })

  describe('when the session is unbound', () => {
    it('states that no note is open when the session is unbound', () => {
      expect(unboundContextText()).toContain('No note is open')
    })

    it('says the other tools still work when the session is unbound', () => {
      expect(unboundContextText()).toContain('Every tool but the editing ones still works')
    })

    describe('when nothing reaches a note', () => {
      it('asks the user to open a note when neither route exists', () => {
        expect(unboundContextText()).toContain('ask them to open one')
      })

      it('tells the model not to call an editing tool when neither route exists', () => {
        expect(unboundContextText()).toContain('rather than calling an editing tool')
      })
    })

    describe('when a command reaches a note', () => {
      it('runs the command that opens the note when a command is allowed', () => {
        expect(unboundContextText(true)).toContain('run the command that opens the note they named')
      })

      it('does not tell the model to ask first when a command is allowed', () => {
        expect(unboundContextText(true)).not.toContain('rather than calling an editing tool')
      })
    })

    // The reported gap: a vault with search and no commands can still reach a
    // note, and was told to ask the user instead.
    describe('when only search reaches a note', () => {
      it('searches for the note when search is the only route', () => {
        expect(unboundContextText(false, true)).toContain('search for it and open what they choose')
      })

      it('does not tell the model to ask first when search is the only route', () => {
        expect(unboundContextText(false, true)).not.toContain('rather than calling an editing tool')
      })

      it('names no command when none is allowed', () => {
        expect(unboundContextText(false, true)).not.toContain('run the command')
      })
    })

    describe('when both routes reach a note', () => {
      it('offers both routes when commands and search are available', () => {
        expect(unboundContextText(true, true)).toContain(
          'run the command that opens the note they named, or search for it',
        )
      })

      it('asks only as a last resort when a route exists', () => {
        expect(unboundContextText(true, true)).toContain('Only ask them to open a note when')
      })
    })

    it('says the session binds to the first note that opens when it is unbound', () => {
      expect(unboundContextText()).toContain('binds to the first note that opens')
    })

    it('names no note when the session is unbound', () => {
      expect(unboundContextText()).not.toContain('Note path:')
    })

    it('leaves the standing rules unchanged when the session is unbound', () => {
      expect(systemPromptText()).not.toContain('No note is open')
    })
  })

  describe('when a tool can reach beyond the open note', () => {
    const catalogue = [new AllowedObsidianCommand('daily-notes:goto-today', 'Open today')]

    it('does not claim other files are unreachable when a command is allowed', () => {
      const prompt = systemPromptText(new AgentsMdChain(), catalogue)

      expect(prompt).not.toContain('You cannot read or write any file other than this note')
    })

    it('does not claim other files are unreachable when search is enabled', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], [], true)

      expect(prompt).not.toContain('You cannot read or write any file other than this note')
    })

    it('says a command can open another note when one is allowed', () => {
      const prompt = systemPromptText(new AgentsMdChain(), catalogue)

      expect(prompt).toContain('open another note by running one of the commands listed below')
    })

    it('says search can read other notes when search is enabled', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], [], true)

      expect(prompt).toContain('read other notes by searching the vault')
    })

    it('names both reaches when commands and search are both available', () => {
      const prompt = systemPromptText(new AgentsMdChain(), catalogue, [], true)

      expect(prompt).toContain('open another note')
      expect(prompt).toContain('read other notes')
    })

    it('keeps the no-undo warning when the reach widens', () => {
      const prompt = systemPromptText(new AgentsMdChain(), catalogue, [], true)

      expect(prompt).toContain('no undo tool')
    })

    const vaultSkills = [aSkill('todo', 'Manages todo.md files.')]

    // What reaches another note is the tool list, so the text says what to do
    // rather than what is possible, and says the same whatever the vault allows.
    it('tells a skill to open the note it names, whatever the vault allows', () => {
      const withCommands = systemPromptText(new AgentsMdChain(), catalogue, vaultSkills)
      const withNeither = systemPromptText(new AgentsMdChain(), [], vaultSkills)

      expect(withCommands).toContain('open it before editing')
      expect(withNeither).toContain('open it before editing')
    })

    it('tells a skill to make no partial edit when nothing reaches the note', () => {
      const prompt = systemPromptText(new AgentsMdChain(), [], vaultSkills)

      expect(prompt).toContain('name the skill, say so, and make no')
      expect(prompt).toContain('partial edit')
    })
  })

  describe('when the prompt states what day it is', () => {
    const THURSDAY = new Today(new Date(2026, 8, 3))

    it('names today whether or not a note is open', () => {
      const snapshot = DateMessage.build(THURSDAY)

      expect(snapshot.content).toContain('Today is 2026-09-03 (Thursday)')
    })

    // The vault's folders are week numbers, so the model is told the current
    // one rather than deriving it from the date.
    it('names the week and the day it began, so neither is derived', () => {
      const snapshot = DateMessage.build(THURSDAY)

      expect(snapshot.content).toContain(
        'Today is 2026-09-03 (Thursday), in week 36, which began Monday 2026-08-31.',
      )
    })

    it('tells the model not to resolve a date against a note name', () => {
      const snapshot = DateMessage.build(THURSDAY)

      expect(snapshot.content).toContain(
        'A note named for a date is not\nevidence of what today is.',
      )
    })

    it('names no note, since the note travels in its own message', () => {
      const snapshot = DateMessage.build(THURSDAY)

      expect(snapshot.content).not.toContain('Note path:')
    })
  })
})
