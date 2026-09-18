import { beforeEach, describe, expect, it } from 'vitest'
import { aToolCall, aTurnState } from '../../test-support/builders'
import { App } from 'obsidian'
import { HarnessToolsService } from '../tools/harness-tools-service'
import { DateToolService } from '../tools/date-tool-service'
import { TurnState } from '../tools/harness-result'
import { ObsidianCommandCatalogue } from '../../commands/obsidian-command-catalogue'
import { ObsidianCommandRegistry } from '../../commands/obsidian-command-registry'
import { ObsidianCommandRunner } from '../../commands/obsidian-command-runner'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { AllowList } from '../../commands/allow-list'
import { NoteGlob } from '../../search/note-glob'
import { NoteGrep } from '../../search/note-grep'
import { TagReader } from '../../search/tag-reader'
import { SearchToolsService } from '../tools/search-tools-service'
import { NoteReader } from '../../search/note-reader'
import { FakeVault } from '../../test-support/fake-vault'
import { ToolCall } from '../../model/providers/types'

const JOURNAL = '1 - Journal/Weekly/Week-35/04-09-Fri.md'

describe('HarnessToolsService listing tags', () => {
  let vault: FakeVault
  let turn: TurnState

  beforeEach(() => {
    vault = new FakeVault().withNote(JOURNAL, 'friday').withTags(JOURNAL, ['#health'])
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

  const listTags = (args: Record<string, unknown> = {}, searchEnabled = true) =>
    toolsOf(searchEnabled).execute(aToolCall('list_tags', args), turn)

  describe('when searching is on', () => {
    it('answers the report the tag reader produced', async () => {
      expect((await listTags()).result).toBe('#health - 1 note')
    })

    it('narrows the listing to the filter the call sent', async () => {
      vault.withNote('Quotes/roofing.md', 'roofing').withTags('Quotes/roofing.md', ['#roofing'])

      expect((await listTags({ filter: 'roof' })).result).toBe('#roofing - 1 note')
    })

    // The fallthrough guard: execute ends by offering paths, so a branch left
    // out refuses the call for naming no path rather than listing anything.
    it('does not dispatch it to the note paths shortlist', async () => {
      expect((await listTags()).result).not.toBe('offer at least one path a search returned')
    })

    // What keeps a vocabulary tool out of the write path: a tag it returned is
    // not a note the model may then open.
    it('records no path, so nothing it returned becomes openable', async () => {
      await listTags()

      expect(turn.pathsReturnedByVault.includes(JOURNAL)).toBe(false)
    })
  })

  describe('when searching is off', () => {
    it('refuses the call with the reason', async () => {
      expect((await listTags({}, false)).result).toBe(
        'searching the vault is turned off in settings',
      )
    })

    it('omits list_tags from the schemas, so it is absent as well as refused', () => {
      expect(
        toolsOf(false)
          .getToolCallSchemas()
          .map((schema) => schema.name),
      ).not.toContain('list_tags')
    })
  })

  // The line a wiring change forgets: the schema and the service can both be
  // right while the dispatcher routes the call to the edit tools instead.
  describe('when the dispatcher classifies the call', () => {
    it('counts list_tags as a harness tool, so it is never taken for an edit', () => {
      expect(new ToolCall('id', 'list_tags', {}).isHarnessTool()).toBe(true)
    })

    it('leaves list_tags out of the vault-access gate, since it reaches no path', () => {
      expect(new ToolCall('id', 'list_tags', {}).requiresVaultAccess()).toBe(false)
    })
  })
})
