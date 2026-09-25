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

const QUOTE = 'Quotes/roofing.md'

describe('HarnessToolsService', () => {
  let vault: FakeVault
  let turn: TurnState

  beforeEach(() => {
    vault = new FakeVault()
      .withNote(QUOTE, 'the roofing quote came to 12k')
      .withNote('Lists/shopping.md', 'milk and bread')
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

  const grep = (pattern: string, args: Record<string, unknown> = {}) =>
    toolsOf().execute(aToolCall('grep_notes', { pattern, ...args }), turn)

  const namesOf = (tools: HarnessToolsService) =>
    tools.getToolCallSchemas().map((schema) => schema.name)

  describe('when a grep matches notes', () => {
    it('runs a grep when grep_notes is called, naming the note and its count', async () => {
      const harnessResult = await grep('roofing')

      expect(harnessResult.result).toBe(`${QUOTE} (1 match): the roofing quote came to 12k`)
    })

    it('records the paths of a grep, so a following open is permitted', async () => {
      await grep('roofing')

      expect(turn.pathsReturnedByVault.includes(QUOTE)).toBe(true)
    })

    it("records the paths as found by this turn's search, so the turn answers from it", async () => {
      await grep('roofing')

      expect(turn.pathsFoundBySearch.includes(QUOTE)).toBe(true)
    })

    it('reports a grep as a step, naming the expression and the count', async () => {
      const harnessResult = await grep('roofing')

      expect(harnessResult.publishStepSummary?.detail).toBe('roofing in the whole vault — 1 note')
    })

    it('returns paths alone when paths_only is asked for', async () => {
      const harnessResult = await grep('roofing', { paths_only: true })

      expect(harnessResult.result).toBe(QUOTE)
    })

    it('narrows to the folder when path_pattern is given', async () => {
      const harnessResult = await grep('the', { path_pattern: 'Quotes/*.md', paths_only: true })

      expect(harnessResult.result).toBe(QUOTE)
    })

    it('narrows to the listed notes when paths is given', async () => {
      const harnessResult = await grep('the', { paths: [QUOTE], paths_only: true })

      expect(harnessResult.result).toBe(QUOTE)
    })
  })

  describe('when a grep matches nothing', () => {
    it('says no note contains the pattern when every note was read', async () => {
      const harnessResult = await grep('plumbing')

      expect(harnessResult.result).toBe('no notes contain plumbing')
    })

    // Unqualified, this reads as an answer about the vault, and a model that
    // believes the tag exists nowhere stops looking instead of widening.
    it('says which narrowing found nothing, so the miss is not read as the vault', async () => {
      const harnessResult = await grep('plumbing', { path_pattern: 'Quotes/*.md' })

      expect(harnessResult.result).toBe(
        'no notes in Quotes/*.md contain plumbing; the search went no wider than that',
      )
    })

    it('names the narrowing that matched none, so the text is not read as absent', async () => {
      const harnessResult = await grep('roofing', { path_pattern: 'Nowhere/*.md' })

      expect(harnessResult.result).toBe(
        'no notes to search: Nowhere/*.md matched none, so nothing was read for the pattern',
      )
    })

    // A narrowing whose shape cannot match is the case that costs a turn its
    // steps: the model reads "matched none" as a fact about the vault and
    // rewrites the parts that were never wrong.
    it('says why a folder-shaped narrowing could never match', async () => {
      const harnessResult = await grep('roofing', { path_pattern: 'Quotes' })

      expect(harnessResult.result).toContain('this matches notes, not folders')
    })

    it('reads a brace list in a narrowing, so it admits the notes it names', async () => {
      const harnessResult = await grep('roofing', { path_pattern: '{Quotes,Lists}/*.md' })

      expect(harnessResult.result).toContain('Quotes/roofing.md')
    })
  })

  describe('when the expression is invalid', () => {
    it('refuses an invalid expression by saying so, rather than failing the turn', async () => {
      const harnessResult = await grep('roofing(')

      expect(harnessResult.result).toBe('roofing( is not a valid regular expression')
    })

    it('reports the invalid expression as a refusal', async () => {
      const harnessResult = await grep('roofing(')

      expect(harnessResult.publishStepSummary?.refused).toBe(true)
    })
  })

  describe('when search is disabled', () => {
    it('omits grep_notes from the schemas when search is disabled', () => {
      expect(namesOf(toolsOf(false))).not.toContain('grep_notes')
    })

    it('refuses the grep when search is disabled', async () => {
      const harnessResult = await toolsOf(false).execute(
        aToolCall('grep_notes', { pattern: 'roofing' }),
        turn,
      )

      expect(harnessResult.result).toBe('searching the vault is turned off in settings')
    })
  })

  describe('when the offered set is read', () => {
    it('offers grep_notes when search is enabled', () => {
      expect(namesOf(toolsOf())).toContain('grep_notes')
    })
  })
})
