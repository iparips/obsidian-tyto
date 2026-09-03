import { beforeEach, describe, expect, it } from 'vitest'
import { App } from 'obsidian'
import { HarnessTools } from '../harness-tools'
import { TurnState } from '../harness-result'
import { TurnBudget } from '../models/turn-budget'
import { SeenPaths } from '../../search/models/seen-paths'
import { SearchHit } from '../../search/models/search-hit'
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
      new NoteReader(vault.asVault()),
      catalogue,
      searchEnabled,
      new SearchTools(new NoteGlob(vault.asVault()), new NoteGrep(vault.asVault())),
    )
  }

  const openNote = (path: string) => toolsOf().execute(aToolCall('open_note', { path }), turn)

  // A glob rather than a search: this helper exists to put a path in SeenPaths
  // so open_note will accept it, and a glob does that as well as a search did.
  const findsTodo = () =>
    toolsOf().execute(aToolCall('glob_notes', { pattern: 'Journal/Weekly/Week-36/*.md' }), turn)

  describe('when a glob has offered the path', () => {
    beforeEach(async () => {
      await findsTodo()
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
        `${TODO} was not returned by a search this session; search for it before opening it`,
      )
    })

    it('offers no path when the path was never returned by a search', async () => {
      const harnessResult = await openNote(TODO)

      expect(harnessResult.openPath).toBeUndefined()
    })
  })

  describe('when the open budget is spent', () => {
    beforeEach(async () => {
      await findsTodo()
      await openNote(TODO)
      // The dispatcher spends the cap once an open is granted; at this level
      // nothing has granted one, so the test states what a granted open left.
      turn.budget.takeOpen(TODO)
    })

    it('refuses a second note when the cap is reached, naming it', async () => {
      turn.seenPaths.recordPaths(['Journal/Weekly/Week-36/other.md'])

      const harnessResult = await openNote('Journal/Weekly/Week-36/other.md')

      expect(harnessResult.result).toBe(
        'this turn has already opened 1 note; edit that note rather than opening another',
      )
    })

    // A command can move the target off the approved note without the model
    // choosing to, so returning to it must not cost a second open.
    it('reopens the same note when the cap is reached, since it is not a second note', async () => {
      const harnessResult = await openNote(TODO)

      expect(harnessResult.openPath).toBe(TODO)
    })

    // The seen-path check comes first now, so a path the model never found is
    // told that rather than being blamed on the cap.
    it('reports the unseen path rather than the cap when the path was never offered', async () => {
      const harnessResult = await openNote('Never/searched.md')

      expect(harnessResult.result).toBe(
        'Never/searched.md was not returned by a search this session; search for it before opening it',
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
      await findsTodo()

      expect(turn.seenPaths.includes(TODO)).toBe(true)
    })
  })
})
