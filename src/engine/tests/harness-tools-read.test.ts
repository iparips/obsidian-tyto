import { beforeEach, describe, expect, it } from 'vitest'
import { App } from 'obsidian'
import { HarnessToolsService } from '../tools/harness-tools-service'
import { TurnState } from '../tools/harness-result'
import { NotesOpenedCounter } from '../turn/notes-opened-counter'
import { PathsReturnedByVaultRepository } from '../turn/paths-returned-by-vault-repository'
import { ObsidianCommandCatalogue } from '../../commands/obsidian-command-catalogue'
import { ObsidianCommandRegistry } from '../../commands/obsidian-command-registry'
import { ObsidianCommandRunner } from '../../commands/obsidian-command-runner'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { AllowList } from '../../commands/allow-list'
import { NoteGlob } from '../../search/note-glob'
import { NoteGrep } from '../../search/note-grep'
import { SearchToolsService } from '../tools/search-tools-service'
import { DateToolService } from '../tools/date-tool-service'
import { NoteReader } from '../../search/note-reader'
import { FakeVault } from '../../test-support/fake-vault'
import { aToolCall } from '../../test-support/builders'

const TODO = 'Journal/Weekly/Week-36/todo.md'
const MISSING = 'Journal/Weekly/Week-99/todo.md'

describe('HarnessToolsService', () => {
  let vault: FakeVault
  let turn: TurnState

  beforeEach(() => {
    vault = new FakeVault().withNote(TODO, '- [ ] milk')
    turn = {
      notesOpenedCounter: new NotesOpenedCounter(),
      pathsReturnedByVault: new PathsReturnedByVaultRepository(),
    }
  })

  const toolsOf = (): HarnessToolsService => {
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
      true,
      new SearchToolsService(new NoteGlob(vault.asVault()), new NoteGrep(vault.asVault())),
      new DateToolService(),
    )
  }

  const readNote = (path: string) => toolsOf().execute(aToolCall('read_note', { path }), turn)

  // A skill names a path outright, so the model can read it without searching.
  // Without the read counting as having found it, the path can never be offered
  // or opened, and every edit that follows is refused.
  describe('when the vault answers the read', () => {
    it('yields the contents when the note exists', async () => {
      const harnessResult = await readNote(TODO)

      expect(harnessResult.result).toBe('- [ ] milk')
    })

    it('records the path as found when the read succeeds', async () => {
      await readNote(TODO)

      expect(turn.pathsReturnedByVault.includes(TODO)).toBe(true)
    })
  })

  describe('when the vault has no such note', () => {
    it('refuses the read when the note is missing', async () => {
      const harnessResult = await readNote(MISSING)

      expect(harnessResult.result).toBe(`no note at ${MISSING}`)
    })

    it('records no path when the read fails', async () => {
      await readNote(MISSING)

      expect(turn.pathsReturnedByVault.includes(MISSING)).toBe(false)
    })
  })
})
