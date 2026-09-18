import { beforeEach, describe, expect, it } from 'vitest'
import { aTurnState } from '../../test-support/builders'
import { App } from 'obsidian'
import { HarnessToolsService } from '../tools/harness-tools-service'
import { HarnessResult, TurnState } from '../tools/harness-result'
import { HarnessResultKind } from '../tools/harness-result-kind'
import { SearchHit } from '../../search/models/search-hit'
import { ObsidianCommandCatalogue } from '../../commands/obsidian-command-catalogue'
import { ObsidianCommandRegistry } from '../../commands/obsidian-command-registry'
import { ObsidianCommandRunner } from '../../commands/obsidian-command-runner'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { AllowList } from '../../commands/allow-list'
import { NoteGlob } from '../../search/note-glob'
import { NoteGrep } from '../../search/note-grep'
import { TagReader } from '../../search/tag-reader'
import { SearchToolsService } from '../tools/search-tools-service'
import { DateToolService } from '../tools/date-tool-service'
import { NoteReader } from '../../search/note-reader'
import { FakeVault } from '../../test-support/fake-vault'
import { aToolCall } from '../../test-support/builders'

const TODO = 'Journal/Weekly/Week-36/todo.md'

describe('HarnessToolsService', () => {
  let vault: FakeVault
  let turn: TurnState

  beforeEach(() => {
    vault = new FakeVault().withNote(TODO, '- [ ] milk')
    turn = aTurnState()
  })

  const toolsOf = (searchEnabled = true): HarnessToolsService => {
    const app = {} as App
    const catalogue = new ObsidianCommandCatalogue(
      new ObsidianCommandRegistry(app),
      new AllowList([]),
    )
    return new HarnessToolsService(
      new ObsidianCommandRunner(
        app,
        catalogue,
        new OpenedNoteWait(app),
        new ObsidianCommandRegistry(app),
      ),
      new NoteReader(vault.asVault()),
      catalogue,
      searchEnabled,
      new SearchToolsService(
        new NoteGlob(vault.asVault()),
        new NoteGrep(vault.asVault()),
        new TagReader(vault.asVault(), vault.asMetadataCache()),
      ),
      new DateToolService(),
    )
  }

  const openNote = (path: string) => toolsOf().execute(aToolCall('open_note', { path }), turn)

  // Null unless the open was granted, so a refusal fails the assertion rather
  // than reading undefined off a result that never carried a path.
  const openedPathOf = (harnessResult: HarnessResult): string | null =>
    harnessResult.kind === HarnessResultKind.OpenNote ? harnessResult.openNoteAtPath : null

  // A glob rather than a search: this helper exists to put a path in PathsReturnedByVaultRepository
  // so open_note will accept it, and a glob does that as well as a search did.
  const findsTodo = () =>
    toolsOf().execute(aToolCall('glob_notes', { pattern: 'Journal/Weekly/Week-36/*.md' }), turn)

  describe('when a glob has offered the path', () => {
    beforeEach(async () => {
      await findsTodo()
    })

    it('yields the path to open when every guard passes', async () => {
      const harnessResult = await openNote(TODO)

      expect(openedPathOf(harnessResult)).toBe(TODO)
    })

    it('tells the model the note opened when every guard passes', async () => {
      const harnessResult = await openNote(TODO)

      expect(harnessResult.result).toBe(`opened ${TODO}`)
    })

    it('refuses the open when no note exists at the path', async () => {
      turn.pathsReturnedByVault.record([new SearchHit('Gone/away.md', 1, '')])

      const harnessResult = await openNote('Gone/away.md')

      expect(harnessResult.result).toBe('no note at Gone/away.md')
    })

    it('offers no path when no note exists at the path', async () => {
      turn.pathsReturnedByVault.record([new SearchHit('Gone/away.md', 1, '')])

      const harnessResult = await openNote('Gone/away.md')

      expect(openedPathOf(harnessResult)).toBeNull()
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

      expect(openedPathOf(harnessResult)).toBeNull()
    })
  })

  describe('when the open budget is spent', () => {
    beforeEach(async () => {
      await findsTodo()
      await openNote(TODO)
      // The dispatcher spends the cap once an open is granted; at this level
      // nothing has granted one, so the test states what a granted open left.
      turn.notesOpenedCounter.takeOpen(TODO)
    })

    it('refuses a second note when the cap is reached, naming it', async () => {
      turn.pathsReturnedByVault.recordPaths(['Journal/Weekly/Week-36/other.md'])

      const harnessResult = await openNote('Journal/Weekly/Week-36/other.md')

      expect(harnessResult.result).toBe(
        'this turn has already opened 1 note; edit that note rather than opening another',
      )
    })

    // A command can move the target off the approved note without the model
    // choosing to, so returning to it must not cost a second open.
    it('reopens the same note when the cap is reached, since it is not a second note', async () => {
      const harnessResult = await openNote(TODO)

      expect(openedPathOf(harnessResult)).toBe(TODO)
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
          .getToolCallSchemas()
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

      expect(turn.pathsReturnedByVault.includes(TODO)).toBe(true)
    })
  })
})
