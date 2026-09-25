import { beforeEach, describe, expect, it } from 'vitest'
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
import { TagReader } from '../../search/tag-reader'
import { SearchToolsService } from '../tools/search-tools-service'
import { DateToolService } from '../tools/date-tool-service'
import { NoteReader } from '../../search/note-reader'
import { FakeVault } from '../../test-support/fake-vault'
import { aToolCall } from '../../test-support/builders'

const WEEK = '1 - Journal/Weekly/Week-35'
const FRIDAY = `${WEEK}/04-09-Fri.md`
const THURSDAY = `${WEEK}/03-09-Thu.md`

describe('HarnessToolsService', () => {
  let vault: FakeVault
  let turn: TurnState

  beforeEach(() => {
    vault = new FakeVault().withNote(FRIDAY, 'friday').withNote(THURSDAY, 'thursday')
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

  const glob = (pattern: string, args: Record<string, unknown> = {}) =>
    toolsOf().execute(aToolCall('glob_notes', { pattern, ...args }), turn)

  const namesOf = (tools: HarnessToolsService) =>
    tools.getToolCallSchemas().map((schema) => schema.name)

  describe('when a glob matches notes', () => {
    it('runs a glob when glob_notes is called, listing one path per line', async () => {
      const harnessResult = await glob(`${WEEK}/*.md`)

      expect(harnessResult.result).toBe(`${THURSDAY}\n${FRIDAY}`)
    })

    it('records the paths of a glob, so a following open is permitted', async () => {
      await glob(`${WEEK}/*.md`)

      expect(turn.pathsReturnedByVault.includes(FRIDAY)).toBe(true)
    })

    it("records the paths as found by this turn's search, so the turn answers from it", async () => {
      await glob(`${WEEK}/*.md`)

      expect(turn.pathsFoundBySearch.includes(FRIDAY)).toBe(true)
    })

    it('reports a glob as a step, naming the pattern and the count', async () => {
      const harnessResult = await glob(`${WEEK}/*.md`)

      expect(harnessResult.publishStepSummary?.detail).toBe(`${WEEK}/*.md — 2 notes`)
    })

    it('orders the paths as the call asked when a sort is given', async () => {
      const harnessResult = await glob(`${WEEK}/*.md`, { sort: 'path', order: 'descending' })

      expect(harnessResult.result).toBe(`${FRIDAY}\n${THURSDAY}`)
    })
  })

  describe('when a glob matches nothing', () => {
    it('says nothing matched when the pattern reaches no note', async () => {
      const harnessResult = await glob('Nowhere/*.md')

      expect(harnessResult.result).toBe('no notes match Nowhere/*.md')
    })

    it('reports the empty glob as a step rather than a refusal', async () => {
      const harnessResult = await glob('Nowhere/*.md')

      expect(harnessResult.publishStepSummary?.refused).toBe(false)
    })

    it('reads a brace list, so one call covers both notes it names', async () => {
      const harnessResult = await glob(`${WEEK}/{04-09-Fri,03-09-Thu}.md`)

      expect(harnessResult.result).toContain(FRIDAY)
      expect(harnessResult.result).toContain(THURSDAY)
    })

    it('says a character class did not close, since the bracket then matched itself', async () => {
      const harnessResult = await glob('Quotes/roof[ing/*.md')

      expect(harnessResult.result).toContain('did not close on the same folder name')
    })

    it('says nothing more when the pattern is well formed and simply misses', async () => {
      const harnessResult = await glob('Quotes/nothing[0-9].md')

      expect(harnessResult.result).toBe('no notes match Quotes/nothing[0-9].md')
    })
  })

  describe('when more notes match than the cap', () => {
    beforeEach(() => {
      Array.from({ length: 55 }).forEach((_, index) =>
        vault.withNote(`Many/note-${String(index).padStart(3, '0')}.md`, 'body'),
      )
    })

    it('says how many were found when the cap trimmed the rows', async () => {
      const harnessResult = await glob('Many/*.md')

      expect(harnessResult.result).toContain(
        'showing the first 50 of 55; narrow the pattern to see the rest',
      )
    })
  })

  describe('when search is disabled', () => {
    it('omits glob_notes from the schemas when search is disabled', () => {
      expect(namesOf(toolsOf(false))).not.toContain('glob_notes')
    })

    it('refuses the glob when search is disabled', async () => {
      const harnessResult = await toolsOf(false).execute(
        aToolCall('glob_notes', { pattern: '**/*.md' }),
        turn,
      )

      expect(harnessResult.result).toBe('searching the vault is turned off in settings')
    })
  })

  describe('when the offered set is read', () => {
    it('offers search_vault nowhere, since it no longer exists', () => {
      expect(namesOf(toolsOf())).not.toContain('search_vault')
    })

    it('offers glob_notes when search is enabled', () => {
      expect(namesOf(toolsOf())).toContain('glob_notes')
    })
  })
})
