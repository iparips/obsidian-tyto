import { describe, expect, it } from 'vitest'
import { AllowList } from '../allow-list'

describe('AllowList', () => {
  describe('when an entry is an exact id', () => {
    const list = new AllowList(['daily-notes:goto-today'])

    it('permits the id when it is on the list', () => {
      expect(list.permits('daily-notes:goto-today')).toBe(true)
    })

    it('refuses an id when it is absent from the list', () => {
      expect(list.permits('daily-notes:goto-prev')).toBe(false)
    })
  })

  describe('when an entry is a namespace pattern', () => {
    const list = new AllowList(['daily-notes:*'])

    it('permits an id under the named plugin when the pattern matches', () => {
      expect(list.permits('daily-notes:goto-today')).toBe(true)
    })

    it('refuses an id under a plugin whose name shares a prefix', () => {
      expect(list.permits('daily-notes-extra:goto-today')).toBe(false)
    })
  })

  describe('when the list is empty', () => {
    it('permits nothing when no entry is listed', () => {
      expect(new AllowList([]).permits('daily-notes:goto-today')).toBe(false)
    })
  })

  describe('when an entry is invalid', () => {
    it('matches nothing when the entry has no colon', () => {
      expect(new AllowList(['daily-notes']).permits('daily-notes')).toBe(false)
    })
  })

  describe('when an entry is validated', () => {
    it('refuses an entry with no colon', () => {
      expect(AllowList.validate('daily-notes')).toBe(
        'an entry must name a plugin, as plugin-id:command-id',
      )
    })

    it('refuses an entry with a wildcard in the plugin id', () => {
      expect(AllowList.validate('daily-*:goto-today')).toBe(
        'a wildcard cannot appear in the plugin id',
      )
    })

    it('refuses an entry with a wildcard before the end', () => {
      expect(AllowList.validate('daily-notes:*-today')).toBe(
        'a wildcard may only appear at the end of an entry',
      )
    })

    it('accepts an entry with a trailing wildcard', () => {
      expect(AllowList.validate('daily-notes:*')).toBeNull()
    })

    it('accepts an exact id with no wildcard', () => {
      expect(AllowList.validate('daily-notes:goto-today')).toBeNull()
    })
  })
})
