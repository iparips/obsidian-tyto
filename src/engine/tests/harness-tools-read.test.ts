import { beforeEach, describe, expect, it } from 'vitest'
import { App } from 'obsidian'
import { HarnessTools } from '../tools/harness-tools'
import { TurnState } from '../tools/harness-result'
import { TurnBudget } from '../turn/turn-budget'
import { SeenPaths } from '../../search/models/seen-paths'
import { CommandCatalogue } from '../../commands/command-catalogue'
import { CommandRegistry } from '../../commands/command-registry'
import { CommandRunner } from '../../commands/command-runner'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { AllowList } from '../../commands/allow-list'
import { NoteGlob } from '../../search/note-glob'
import { NoteGrep } from '../../search/note-grep'
import { SearchTools } from '../tools/search-tools'
import { NoteReader } from '../../search/note-reader'
import { FakeVault } from '../../test-support/fake-vault'
import { aToolCall } from '../../test-support/builders'

const TODO = 'Journal/Weekly/Week-36/todo.md'
const MISSING = 'Journal/Weekly/Week-99/todo.md'

describe('HarnessTools', () => {
  let vault: FakeVault
  let turn: TurnState

  beforeEach(() => {
    vault = new FakeVault().withNote(TODO, '- [ ] milk')
    turn = { budget: new TurnBudget(), seenPaths: new SeenPaths(), searchRan: () => undefined }
  })

  const toolsOf = (): HarnessTools => {
    const app = {} as App
    const catalogue = new CommandCatalogue(new CommandRegistry(app), new AllowList([]))
    return new HarnessTools(
      new CommandRunner(app, catalogue, new OpenedNoteWait(app), new CommandRegistry(app)),
      new NoteReader(vault.asVault()),
      catalogue,
      true,
      new SearchTools(new NoteGlob(vault.asVault()), new NoteGrep(vault.asVault())),
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

      expect(turn.seenPaths.includes(TODO)).toBe(true)
    })
  })

  describe('when the vault has no such note', () => {
    it('refuses the read when the note is missing', async () => {
      const harnessResult = await readNote(MISSING)

      expect(harnessResult.result).toBe(`no note at ${MISSING}`)
    })

    it('records no path when the read fails', async () => {
      await readNote(MISSING)

      expect(turn.seenPaths.includes(MISSING)).toBe(false)
    })
  })
})
