import { beforeEach, describe, expect, it } from 'vitest'
import { App } from 'obsidian'
import { HarnessTools, TurnState } from '../harness-tools'
import { TurnBudget } from '../models/turn-budget'
import { SeenPaths } from '../../search/models/seen-paths'
import { SearchHit } from '../../search/models/search-hit'
import { CommandCatalogue } from '../../commands/command-catalogue'
import { CommandRegistry } from '../../commands/command-registry'
import { CommandRunner } from '../../commands/command-runner'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { AllowList } from '../../commands/allow-list'
import { VaultSearch } from '../../search/vault-search'
import { NoteReader } from '../../search/note-reader'
import { FakeVault } from '../../test-support/fake-vault'
import { aToolCall } from '../../test-support/builders'

const TODO = 'Journal/Weekly/Week-36/todo.md'

describe('HarnessTools', () => {
  let vault: FakeVault
  let turn: TurnState

  beforeEach(() => {
    vault = new FakeVault().withNote(TODO, '- [ ] milk')
    turn = { budget: new TurnBudget(), seenPaths: new SeenPaths() }
  })

  const toolsOf = (searchEnabled = true): HarnessTools => {
    const app = {} as App
    const catalogue = new CommandCatalogue(new CommandRegistry(app), new AllowList([]))
    return new HarnessTools(
      new CommandRunner(app, catalogue, new OpenedNoteWait(app), new CommandRegistry(app)),
      new VaultSearch(vault.asVault()),
      new NoteReader(vault.asVault()),
      catalogue,
      searchEnabled,
    )
  }

  const openNote = (path: string) => toolsOf().execute(aToolCall('open_note', { path }), turn)

  const search = (query: string) => toolsOf().execute(aToolCall('search_vault', { query }), turn)

  describe('when a search has offered the path', () => {
    beforeEach(async () => {
      await search('milk')
    })

    it('yields the path to open when every guard passes', async () => {
      const harnessResult = await openNote(TODO)

      expect(harnessResult.openPath).toBe(TODO)
    })

    it('tells the model the note opened when every guard passes', async () => {
      const harnessResult = await openNote(TODO)

      expect(harnessResult.result).toBe(`opened ${TODO}`)
    })

    it('refuses the open when no note exists at the path', async () => {
      turn.seenPaths.record([new SearchHit('Gone/away.md', 1, '')])

      const harnessResult = await openNote('Gone/away.md')

      expect(harnessResult.result).toBe('no note at Gone/away.md')
    })

    it('offers no path when no note exists at the path', async () => {
      turn.seenPaths.record([new SearchHit('Gone/away.md', 1, '')])

      const harnessResult = await openNote('Gone/away.md')

      expect(harnessResult.openPath).toBeUndefined()
    })
  })

  describe('when no search has offered the path', () => {
    it('refuses the open when the path was never returned by a search', async () => {
      const harnessResult = await openNote(TODO)

      expect(harnessResult.result).toBe(
        `${TODO} was not returned by a search this turn; search for it before opening it`,
      )
    })

    it('offers no path when the path was never returned by a search', async () => {
      const harnessResult = await openNote(TODO)

      expect(harnessResult.openPath).toBeUndefined()
    })
  })

  describe('when the open budget is spent', () => {
    beforeEach(async () => {
      await search('milk')
      await openNote(TODO)
    })

    it('refuses the open when the cap is reached, naming it', async () => {
      const harnessResult = await openNote(TODO)

      expect(harnessResult.result).toBe(
        'this turn has already opened 1 note; edit that note rather than opening another',
      )
    })

    it('reports the cap rather than the path when the path was never offered', async () => {
      const harnessResult = await openNote('Never/searched.md')

      expect(harnessResult.result).toBe(
        'this turn has already opened 1 note; edit that note rather than opening another',
      )
    })
  })

  describe('when search is disabled', () => {
    it('omits open_note from the schemas when search is disabled', () => {
      expect(
        toolsOf(false)
          .schemas()
          .map((schema) => schema.name),
      ).not.toContain('open_note')
    })

    it('refuses the open when search is disabled', async () => {
      const harnessResult = await toolsOf(false).execute(
        aToolCall('open_note', { path: TODO }),
        turn,
      )

      expect(harnessResult.result).toBe('searching the vault is turned off in settings')
    })
  })

  describe('when a search returns hits', () => {
    it('records the paths of a search when hits come back', async () => {
      await search('milk')

      expect(turn.seenPaths.includes(TODO)).toBe(true)
    })
  })
})
