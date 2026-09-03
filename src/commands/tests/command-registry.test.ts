import { beforeEach, describe, expect, it } from 'vitest'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'

describe('CommandRegistry', () => {
  let fake: FakeCommandRegistry

  beforeEach(() => {
    fake = new FakeCommandRegistry()
  })

  describe('when the registry holds commands', () => {
    beforeEach(() => {
      fake
        .withCommand('daily-notes:goto-today', 'Open today')
        .withCommand('editor:toggle-bold', 'Toggle bold')
    })

    it('lists every registered command when none is filtered out', () => {
      expect(
        fake
          .asRegistry()
          .list()
          .map((command) => command.id),
      ).toEqual(['daily-notes:goto-today', 'editor:toggle-bold'])
    })

    it('carries the display name when a command is listed', () => {
      expect(fake.asRegistry().list()[0].name).toBe('Open today')
    })

    it('reports itself reachable when the registry methods are present', () => {
      expect(fake.asRegistry().isReachable()).toBe(true)
    })
  })

  describe('when a command is unavailable in the current context', () => {
    it('drops the command when the registry reports it unavailable', () => {
      fake
        .withCommand('daily-notes:goto-today', 'Open today')
        .withUnavailableCommand('daily-notes:goto-prev', 'Open previous')

      expect(
        fake
          .asRegistry()
          .list()
          .map((command) => command.id),
      ).toEqual(['daily-notes:goto-today'])
    })
  })

  describe('when the registry methods are absent', () => {
    beforeEach(() => {
      fake.withCommand('daily-notes:goto-today', 'Open today').withoutRegistryMethods()
    })

    it('yields nothing when the registry methods are missing', () => {
      expect(fake.asRegistry().list()).toEqual([])
    })

    it('reports itself unreachable when the registry methods are missing', () => {
      expect(fake.asRegistry().isReachable()).toBe(false)
    })
  })

  describe('when a command is executed', () => {
    beforeEach(() => {
      fake.withCommand('daily-notes:goto-today', 'Open today')
    })

    it('passes the id to the registry when the command is run', () => {
      fake.asRegistry().executeCommandById('daily-notes:goto-today')

      expect(fake.executed).toEqual(['daily-notes:goto-today'])
    })

    it('reports acceptance when the registry knows the id', () => {
      expect(fake.asRegistry().executeCommandById('daily-notes:goto-today')).toBe(true)
    })

    it('reports refusal when the registry does not know the id', () => {
      expect(fake.asRegistry().executeCommandById('shopping:add')).toBe(false)
    })
  })
})
