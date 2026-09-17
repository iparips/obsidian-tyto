import { beforeEach, describe, expect, it } from 'vitest'
import { TargetNoteWriter } from '../note-editing/target-note-writer'
import { NoteEditor } from '../note-editing/note-editor'
import { OpenNote } from '../note-editing/open-note'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { aTurnState } from '../../test-support/builders'
import { App } from 'obsidian'
import { HarnessToolsService } from '../tools/harness-tools-service'
import { TurnState } from '../tools/harness-result'
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
import { FakeWorkspace } from '../../test-support/fake-workspace'

const TODO = 'Journal/Weekly/Week-36/todo.md'
const MISSING = 'Journal/Weekly/Week-99/todo.md'

describe('HarnessToolsService', () => {
  let vault: FakeVault
  let turn: TurnState

  beforeEach(() => {
    vault = new FakeVault().withNote(TODO, '- [ ] milk')
    turn = aTurnState()
  })

  const toolsOf = (targetNoteWriter: TargetNoteWriter | null = null): HarnessToolsService => {
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
      targetNoteWriter,
    )
  }

  const readNote = (path: string, targetNoteWriter: TargetNoteWriter | null = null) =>
    toolsOf(targetNoteWriter).execute(aToolCall('read_note', { path }), turn)

  const aWriter = (locator: FakeNoteLocator): TargetNoteWriter =>
    new TargetNoteWriter(
      new NoteEditor(),
      locator,
      vault.asVault(),
      new FakeWorkspace().asWorkspace(),
    )

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

  // D1: a read of the note the turn writes to comes from the editor its writes
  // go through, so an anchor the model matches is one the write will find.
  describe('when the path is the target the turn holds', () => {
    it('answers from the editor when its text is the file the path names', async () => {
      const editor = new FakeEditor('- [ ] milk')
      turn = aTurnState(new OpenNote(editor.asEditor(), TODO, editor.getCursor()))

      const harnessResult = await readNote(
        TODO,
        aWriter(new FakeNoteLocator().withOpenNote(TODO, editor)),
      )

      expect(harnessResult.result).toBe('- [ ] milk')
    })

    // D1's accepted cost: an editor holding text the file lacks reads the same
    // way a half-opened view does, so both take the vault.
    it('answers from the file while the editor holds text it has not saved', async () => {
      const editor = new FakeEditor('- [ ] milk\n- [ ] eggs, unsaved')
      turn = aTurnState(new OpenNote(editor.asEditor(), TODO, editor.getCursor()))

      const harnessResult = await readNote(
        TODO,
        aWriter(new FakeNoteLocator().withOpenNote(TODO, editor)),
      )

      expect(harnessResult.result).toBe('- [ ] milk')
    })

    it('answers from the file once the tab has moved off it', async () => {
      const editor = new FakeEditor('- [ ] milk\n- [ ] eggs, unsaved')
      turn = aTurnState(new OpenNote(editor.asEditor(), TODO, editor.getCursor()))

      const harnessResult = await readNote(
        TODO,
        aWriter(new FakeNoteLocator().withOpenNote('other.md', new FakeEditor('# Other'))),
      )

      expect(harnessResult.result).toBe('- [ ] milk')
    })
  })

  describe('when the path is a note the turn is not on', () => {
    it('answers from the file, as a read of any other note does', async () => {
      const editor = new FakeEditor('# Shopping, unsaved')
      turn = aTurnState(new OpenNote(editor.asEditor(), 'shopping.md', editor.getCursor()))

      const harnessResult = await readNote(
        TODO,
        aWriter(new FakeNoteLocator().withOpenNote('shopping.md', editor)),
      )

      expect(harnessResult.result).toBe('- [ ] milk')
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
