import { beforeEach, describe, expect, it } from 'vitest'
import { aTurnState } from '../../test-support/builders'
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
import { aToolCall } from '../../test-support/builders'
import { ToolCall } from '../../model/providers/types'

// Friday 2026-09-11, the day of the reported turn.
const FRIDAY = new Date(2026, 8, 11)

describe('HarnessToolsService', () => {
  let vault: FakeVault
  let turn: TurnState

  beforeEach(() => {
    vault = new FakeVault()
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
      new DateToolService(() => FRIDAY),
    )
  }

  const resolveDate = (phrase: string, searchEnabled = true) =>
    toolsOf(searchEnabled).execute(aToolCall('resolve_date', { phrase }), turn)

  const namesOf = (tools: HarnessToolsService) =>
    tools.getToolCallSchemas().map((schema) => schema.name)

  describe('when a date phrase is resolved', () => {
    it('answers with the date, the weekday and the week the phrase named', async () => {
      const result = await resolveDate('last Friday')

      expect(result.result).toBe(
        '"last Friday" is 2026-09-04 (Friday), in week 36, which began Monday 2026-08-31.',
      )
    })

    // Both halves in the panel, or a resolve the user did not mean is invisible.
    it('records a step naming the phrase and the date it became', async () => {
      const result = await resolveDate('last Friday')

      expect(result.publishStepSummary).toEqual({
        label: 'Resolved',
        detail: 'last Friday — 2026-09-04',
        refused: false,
        note: null,
        wroteDirect: false,
      })
    })
  })

  describe('when a date phrase names no single day', () => {
    it('refuses with the reason the resolver gave, unchanged', async () => {
      const result = await resolveDate('my todo list')

      expect(result.result).toContain('no date in "my todo list"')
    })

    it('records the refusal as a step, so a turn stalled on it says why', async () => {
      const result = await resolveDate('my todo list')

      expect(result.publishStepSummary?.refused).toBe(true)
    })
  })

  // Refused here as well as absent from the schemas, so the offered list is
  // never the only thing keeping it out of reach.
  describe('when search is turned off', () => {
    it('refuses the call rather than resolving the phrase', async () => {
      const result = await resolveDate('last Friday', false)

      expect(result.result).toBe('searching the vault is turned off in settings')
    })

    it('omits resolve_date from the schemas, so release 3 is offered its own tools', () => {
      expect(namesOf(toolsOf(false))).not.toContain('resolve_date')
    })
  })

  describe('when search is turned on', () => {
    it('offers resolve_date beside the search tools', () => {
      expect(namesOf(toolsOf())).toContain('resolve_date')
    })
  })

  // The instant is read per call rather than per session, so a turn running
  // past midnight resolves against the day it is on.
  describe('when the service is built with no clock', () => {
    it('resolves against the current date', () => {
      expect(
        new DateToolService().resolve(aToolCall('resolve_date', { phrase: 'today' })).result,
      ).toContain(new Date().getFullYear().toString())
    })
  })

  // The line a wiring change forgets: the schema and the service can both be
  // right while the dispatcher routes the call to the edit tools instead.
  describe('when the dispatcher classifies the call', () => {
    it('counts resolve_date as a harness tool, so it is never taken for an edit', () => {
      expect(new ToolCall('id', 'resolve_date', {}).isHarnessTool()).toBe(true)
    })
  })
})
