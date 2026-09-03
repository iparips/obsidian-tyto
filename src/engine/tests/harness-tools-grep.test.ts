import { beforeEach, describe, expect, it } from 'vitest'
import { App } from 'obsidian'
import { HarnessTools } from '../harness-tools'
import { TurnState } from '../harness-result'
import { TurnBudget } from '../models/turn-budget'
import { SeenPaths } from '../../search/models/seen-paths'
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

const QUOTE = 'Quotes/roofing.md'

describe('HarnessTools', () => {
  let vault: FakeVault
  let turn: TurnState

  beforeEach(() => {
    vault = new FakeVault()
      .withNote(QUOTE, 'the roofing quote came to 12k')
      .withNote('Lists/shopping.md', 'milk and bread')
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

  const grep = (pattern: string, args: Record<string, unknown> = {}) =>
    toolsOf().execute(aToolCall('grep_notes', { pattern, ...args }), turn)

  const namesOf = (tools: HarnessTools, spent: readonly string[] = []) =>
    tools.schemas(spent).map((schema) => schema.name)

  describe('when a grep matches notes', () => {
    it('runs a grep when grep_notes is called, naming the note and its count', async () => {
      const harnessResult = await grep('roofing')

      expect(harnessResult.result).toBe(`${QUOTE} (1 match): the roofing quote came to 12k`)
    })

    it('records the paths of a grep, so a following open is permitted', async () => {
      await grep('roofing')

      expect(turn.seenPaths.includes(QUOTE)).toBe(true)
    })

    it('reports a grep as a step, naming the expression and the count', async () => {
      const harnessResult = await grep('roofing')

      expect(harnessResult.step?.detail).toBe('roofing — 1 note')
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

    it('says the narrowing matched none when no note was read', async () => {
      const harnessResult = await grep('roofing', { path_pattern: 'Nowhere/*.md' })

      expect(harnessResult.result).toBe('no notes to search: the narrowing matched none')
    })
  })

  describe('when the expression is invalid', () => {
    it('refuses an invalid expression by saying so, rather than failing the turn', async () => {
      const harnessResult = await grep('roofing(')

      expect(harnessResult.result).toBe('roofing( is not a valid regular expression')
    })

    it('reports the invalid expression as a refusal', async () => {
      const harnessResult = await grep('roofing(')

      expect(harnessResult.step?.refused).toBe(true)
    })
  })

  describe('when the grep budget is spent', () => {
    beforeEach(async () => {
      await grep('roofing')
      await grep('roofing')
      await grep('roofing')
      await grep('roofing')
    })

    it('refuses a grep when the grep budget is spent, naming the cap', async () => {
      const harnessResult = await grep('roofing')

      expect(harnessResult.result).toBe(
        'this turn has already searched the text 4 times; answer from what you have',
      )
    })

    it('omits grep_notes from the schemas once its budget is spent', () => {
      expect(namesOf(toolsOf(), turn.budget.spentTools())).not.toContain('grep_notes')
    })

    it('spends the glob budget separately from the grep budget', () => {
      expect(namesOf(toolsOf(), turn.budget.spentTools())).toContain('glob_notes')
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
