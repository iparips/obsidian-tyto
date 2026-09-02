import { beforeEach, describe, expect, it } from 'vitest'
import { CommandCatalogue } from '../command-catalogue'
import { AllowList } from '../allow-list'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'

describe('CommandCatalogue', () => {
  let registry: FakeCommandRegistry

  beforeEach(() => {
    registry = new FakeCommandRegistry()
  })

  const catalogueOf = (...entries: string[]) =>
    new CommandCatalogue(registry.asApp(), new AllowList(entries))

  describe('when entries resolve against the registry', () => {
    beforeEach(() => {
      registry
        .withCommand('daily-notes:goto-today', 'Open todays daily note')
        .withCommand('editor:toggle-bold', 'Toggle bold')
        .withCommand('daily-notes:goto-prev', 'Open previous daily note')
        .withCommand('file-explorer:delete-file', 'Delete file')
    })

    it('yields only the matching commands when a pattern matches two of four', () => {
      const resolved = catalogueOf('daily-notes:*').resolve()

      expect(resolved.map((command) => command.id)).toEqual([
        'daily-notes:goto-today',
        'daily-notes:goto-prev',
      ])
    })

    it('carries the display name when a command resolves', () => {
      const resolved = catalogueOf('daily-notes:goto-today').resolve()

      expect(resolved.map((command) => command.name)).toEqual(['Open todays daily note'])
    })

    it('permits an id that resolves', () => {
      expect(catalogueOf('daily-notes:*').permits('daily-notes:goto-today')).toBe(true)
    })

    it('refuses an id that does not resolve', () => {
      expect(catalogueOf('daily-notes:*').permits('file-explorer:delete-file')).toBe(false)
    })
  })

  describe('when a command is registered after construction', () => {
    it('includes the new command on the next resolve when a pattern covers it', () => {
      registry.withCommand('daily-notes:goto-today', 'Open todays daily note')
      const catalogue = catalogueOf('daily-notes:*')
      catalogue.resolve()

      registry.withCommand('daily-notes:goto-next', 'Open next daily note')

      expect(catalogue.resolve().map((command) => command.id)).toContain('daily-notes:goto-next')
    })
  })

  describe('when a command is unavailable in the current context', () => {
    it('drops the command when the registry reports it unavailable', () => {
      registry
        .withCommand('daily-notes:goto-today', 'Open todays daily note')
        .withUnavailableCommand('daily-notes:goto-prev', 'Open previous daily note')

      const resolved = catalogueOf('daily-notes:*').resolve()

      expect(resolved.map((command) => command.id)).toEqual(['daily-notes:goto-today'])
    })
  })

  describe('when the registry is absent', () => {
    beforeEach(() => {
      registry.withCommand('daily-notes:goto-today', 'Open todays daily note')
      registry.withoutRegistryMethods()
    })

    it('yields an empty catalogue when the registry methods are missing', () => {
      expect(catalogueOf('daily-notes:*').resolve()).toEqual([])
    })

    it('reports itself unreachable when the registry methods are missing', () => {
      expect(catalogueOf('daily-notes:*').isReachable()).toBe(false)
    })
  })

  describe('when the allow-list is empty', () => {
    it('yields an empty catalogue when no entry is listed', () => {
      registry.withCommand('daily-notes:goto-today', 'Open todays daily note')

      expect(catalogueOf().resolve()).toEqual([])
    })
  })
})
