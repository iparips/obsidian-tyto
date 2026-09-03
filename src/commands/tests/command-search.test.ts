import { beforeEach, describe, expect, it } from 'vitest'
import { CommandSearch } from '../command-search'
import { AllowList } from '../allow-list'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'

describe('CommandSearch', () => {
  let registry: FakeCommandRegistry

  beforeEach(() => {
    registry = new FakeCommandRegistry()
  })

  const searchOf = (...entries: string[]) =>
    new CommandSearch(registry.asRegistry(), new AllowList(entries))

  describe('when a query narrows the registry', () => {
    beforeEach(() => {
      registry
        .withCommand('daily-notes:goto-today', 'Open todays daily note')
        .withCommand('editor:toggle-bold', 'Toggle bold')
        .withCommand('open-or-create-file-command:3', 'Open or Create File: Shopping list')
    })

    it('renders nothing when the query is empty', () => {
      expect(searchOf().matching('').matches).toEqual([])
    })

    it('renders nothing when the query is only whitespace', () => {
      expect(searchOf().matching('   ').matches).toEqual([])
    })

    it('reports no overflow when the query is empty', () => {
      expect(searchOf().matching('').overflowed).toBe(false)
    })

    it('matches a substring of the display name when the query is part of a name', () => {
      const results = searchOf().matching('shopping')

      expect(results.matches.map((match) => match.command.id)).toEqual([
        'open-or-create-file-command:3',
      ])
    })

    it('ignores case when the query differs in case from the name', () => {
      expect(searchOf().matching('TOGGLE').matches).toHaveLength(1)
    })

    it('does not match the id when the query reads like an id', () => {
      expect(searchOf().matching('editor:toggle').matches).toEqual([])
    })
  })

  describe('when more commands match than the cap', () => {
    beforeEach(() => {
      Array.from({ length: 21 }, (_, index) =>
        registry.withCommand(`daily-notes:goto-${index}`, `Open note ${index}`),
      )
    })

    it('returns exactly the cap when more than the cap matched', () => {
      expect(searchOf().matching('Open note').matches).toHaveLength(20)
    })

    it('reports the overflow when more than the cap matched', () => {
      expect(searchOf().matching('Open note').overflowed).toBe(true)
    })
  })

  describe('when fewer commands match than the cap', () => {
    it('reports no overflow when the matches fit under the cap', () => {
      registry.withCommand('daily-notes:goto-today', 'Open todays daily note')

      expect(searchOf().matching('Open').overflowed).toBe(false)
    })
  })

  describe('when the allow-list already covers a match', () => {
    beforeEach(() => {
      registry
        .withCommand('daily-notes:goto-today', 'Open todays daily note')
        .withCommand('shopping:add', 'Open the shopping list')
    })

    it('names the exact entry when an id covers the match', () => {
      const results = searchOf('shopping:add').matching('shopping')

      expect(results.matches[0].coveredBy).toBe('shopping:add')
    })

    it('names the pattern when a pattern covers the match', () => {
      const results = searchOf('daily-notes:*').matching('todays')

      expect(results.matches[0].coveredBy).toBe('daily-notes:*')
    })

    it('leaves a match uncovered when no entry covers it', () => {
      const results = searchOf('shopping:add').matching('todays')

      expect(results.matches[0].coveredBy).toBeNull()
    })
  })

  describe('when the registry is unreachable', () => {
    it('renders nothing when the registry methods are missing', () => {
      registry.withCommand('daily-notes:goto-today', 'Open today').withoutRegistryMethods()

      expect(searchOf('daily-notes:*').matching('open').matches).toEqual([])
    })
  })
})
