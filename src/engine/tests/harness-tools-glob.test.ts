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

const WEEK = '1 - Journal/Weekly/Week-35'
const FRIDAY = `${WEEK}/04-09-Fri.md`
const THURSDAY = `${WEEK}/03-09-Thu.md`

describe('HarnessTools', () => {
  let vault: FakeVault
  let turn: TurnState

  beforeEach(() => {
    vault = new FakeVault().withNote(FRIDAY, 'friday').withNote(THURSDAY, 'thursday')
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

  const glob = (pattern: string, args: Record<string, unknown> = {}) =>
    toolsOf().execute(aToolCall('glob_notes', { pattern, ...args }), turn)

  const namesOf = (tools: HarnessTools, spent: readonly string[] = []) =>
    tools.schemas(spent).map((schema) => schema.name)

  describe('when a glob matches notes', () => {
    it('runs a glob when glob_notes is called, listing one path per line', async () => {
      const harnessResult = await glob(`${WEEK}/*.md`)

      expect(harnessResult.result).toBe(`${THURSDAY}\n${FRIDAY}`)
    })

    it('records the paths of a glob, so a following open is permitted', async () => {
      await glob(`${WEEK}/*.md`)

      expect(turn.seenPaths.includes(FRIDAY)).toBe(true)
    })

    it('reports a glob as a step, naming the pattern and the count', async () => {
      const harnessResult = await glob(`${WEEK}/*.md`)

      expect(harnessResult.step?.detail).toBe(`${WEEK}/*.md — 2 notes`)
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

      expect(harnessResult.step?.refused).toBe(false)
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

  describe('when the glob budget is spent', () => {
    beforeEach(async () => {
      await glob(`${WEEK}/*.md`)
      await glob(`${WEEK}/*.md`)
      await glob(`${WEEK}/*.md`)
    })

    it('refuses a glob when the glob budget is spent, naming the cap', async () => {
      const harnessResult = await glob(`${WEEK}/*.md`)

      expect(harnessResult.result).toBe(
        'this turn has already listed 3 times; work from the paths you have',
      )
    })

    it('omits glob_notes from the schemas once its budget is spent', () => {
      expect(namesOf(toolsOf(), turn.budget.spentTools())).not.toContain('glob_notes')
    })

    it('keeps read_note offered when only the glob budget is spent', () => {
      expect(namesOf(toolsOf(), turn.budget.spentTools())).toContain('read_note')
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
