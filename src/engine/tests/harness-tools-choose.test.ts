import { beforeEach, describe, expect, it } from 'vitest'
import { App } from 'obsidian'
import { HarnessTools } from '../harness-tools'
import { TurnState } from '../harness-result'
import { TurnBudget } from '../models/turn-budget'
import { SeenPaths } from '../../search/models/seen-paths'
import { CommandCatalogue } from '../../commands/command-catalogue'
import { CommandRegistry } from '../../commands/command-registry'
import { CommandRunner } from '../../commands/command-runner'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { AllowList } from '../../commands/allow-list'
import { NoteGlob } from '../../search/note-glob'
import { NoteGrep } from '../../search/note-grep'
import { SearchTools } from '../search-tools'
import { NoteReader } from '../../search/note-reader'
import { FakeVault } from '../../test-support/fake-vault'
import { aToolCall } from '../../test-support/builders'

const TODO = 'Journal/Weekly/Week-36/todo.md'
const SHOPPING = 'Lists/shopping.md'
const INVENTED = 'Lists/invented.md'

describe('HarnessTools', () => {
  let vault: FakeVault
  let turn: TurnState

  beforeEach(() => {
    vault = new FakeVault().withNote(TODO, '- [ ] milk').withNote(SHOPPING, '- [ ] bread')
    turn = { budget: new TurnBudget(), seenPaths: new SeenPaths(), searchRan: () => undefined }
  })

  const toolsOf = (searchEnabled = true, choiceOffered = true): HarnessTools => {
    const app = {} as App
    const catalogue = new CommandCatalogue(new CommandRegistry(app), new AllowList([]))
    return new HarnessTools(
      new CommandRunner(app, catalogue, new OpenedNoteWait(app), new CommandRegistry(app)),
      new NoteReader(vault.asVault()),
      catalogue,
      searchEnabled,
      new SearchTools(new NoteGlob(vault.asVault()), new NoteGrep(vault.asVault())),
      choiceOffered,
    )
  }

  const chooseNote = (paths: readonly string[]) =>
    toolsOf().execute(aToolCall('choose_note', { paths, purpose: 'add an item' }), turn)

  describe('when a search has returned every candidate', () => {
    beforeEach(() => {
      turn.seenPaths.recordPaths([TODO, SHOPPING])
    })

    it('runs a choice when choose_note is called', async () => {
      const harnessResult = await chooseNote([TODO, SHOPPING])

      expect(harnessResult.choice?.candidates).toEqual([TODO, SHOPPING])
    })

    it('carries the purpose to the panel, so the user reads what they are agreeing to', async () => {
      const harnessResult = await chooseNote([TODO])

      expect(harnessResult.choice?.purpose).toBe('add an item')
    })

    it('reports the choice as a step, naming how many notes were offered', async () => {
      const harnessResult = await chooseNote([TODO, SHOPPING])

      expect(harnessResult.step).toMatchObject({
        label: 'Offered',
        detail: '2 notes to choose from',
      })
    })

    it('offers a shortlist of one, since one candidate is still the user to confirm', async () => {
      const harnessResult = await chooseNote([TODO])

      expect(harnessResult.choice?.candidates).toEqual([TODO])
    })
  })

  describe('when a candidate was never returned by a search', () => {
    beforeEach(() => {
      turn.seenPaths.recordPaths([TODO])
    })

    it('offers only the candidates a search returned, so an invented path is dropped', async () => {
      const harnessResult = await chooseNote([TODO, INVENTED])

      expect(harnessResult.choice?.candidates).toEqual([TODO])
    })

    it('applies the cap after the filter, so a dropped path does not push a shortlist over it', async () => {
      turn.seenPaths.recordPaths(EIGHT)

      const harnessResult = await chooseNote([...EIGHT, INVENTED])

      expect(harnessResult.choice?.candidates).toHaveLength(8)
    })
  })

  describe('when no candidate was returned by a search', () => {
    it('refuses the call when no candidate was returned by a search, naming them', async () => {
      const harnessResult = await chooseNote([INVENTED, SHOPPING])

      expect(harnessResult.result).toBe(
        `no search returned ${INVENTED}, ${SHOPPING}; search before offering them`,
      )
    })

    it('offers nothing when no candidate was returned by a search', async () => {
      const harnessResult = await chooseNote([INVENTED])

      expect(harnessResult.choice).toBeUndefined()
    })
  })

  describe('when the paths list is empty', () => {
    it('refuses the call when the paths list is empty', async () => {
      const harnessResult = await chooseNote([])

      expect(harnessResult.result).toBe('offer at least one path a search returned')
    })

    it('offers nothing when the paths list is empty', async () => {
      const harnessResult = await chooseNote([])

      expect(harnessResult.choice).toBeUndefined()
    })
  })

  describe('when more notes are offered than the cap', () => {
    beforeEach(() => {
      turn.seenPaths.recordPaths(NINE)
    })

    it('refuses the call when more notes are offered than the cap, naming the cap', async () => {
      const harnessResult = await chooseNote(NINE)

      expect(harnessResult.result).toBe('offer at most 8 notes; narrow your search first')
    })

    it('offers nothing rather than truncating when the cap is exceeded', async () => {
      const harnessResult = await chooseNote(NINE)

      expect(harnessResult.choice).toBeUndefined()
    })
  })

  describe('when search is disabled', () => {
    it('omits choose_note from the schemas when search is disabled', () => {
      expect(namesOf(toolsOf(false).schemas())).not.toContain('choose_note')
    })

    it('refuses the call when search is disabled', async () => {
      turn.seenPaths.recordPaths([TODO])

      const harnessResult = await toolsOf(false).execute(
        aToolCall('choose_note', { paths: [TODO], purpose: 'add an item' }),
        turn,
      )

      expect(harnessResult.result).toBe('searching the vault is turned off in settings')
    })
  })

  describe('when the vault is in auto mode', () => {
    it('omits choose_note from the schemas in auto mode', () => {
      expect(namesOf(toolsOf(true, false).schemas())).not.toContain('choose_note')
    })

    it('offers open_note beside it, since choosing and opening are separate calls', () => {
      expect(namesOf(toolsOf().schemas())).toContain('open_note')
    })

    it('offers choose_note when the vault asks which note, so the mode is what drops it', () => {
      expect(namesOf(toolsOf().schemas())).toContain('choose_note')
    })
  })
})

const EIGHT = Array.from({ length: 8 }, (_, index) => `Journal/note-${index}.md`)
const NINE = Array.from({ length: 9 }, (_, index) => `Journal/note-${index}.md`)

const namesOf = (schemas: { name: string }[]) => schemas.map((schema) => schema.name)
