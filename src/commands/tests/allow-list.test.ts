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

  describe('when an entry is a core command id', () => {
    it('permits a colon-less id when it is listed exactly', () => {
      expect(new AllowList(['daily-notes']).permits('daily-notes')).toBe(true)
    })

    it('refuses a different colon-less id when it is not listed', () => {
      expect(new AllowList(['daily-notes']).permits('graph')).toBe(false)
    })
  })

  describe('when an entry is invalid', () => {
    it('matches nothing when a pattern has no colon', () => {
      expect(new AllowList(['daily*']).permits('daily-notes')).toBe(false)
    })
  })

  describe('when an entry is validated', () => {
    it('refuses a pattern with no colon', () => {
      expect(AllowList.validate('daily*')).toBe('a pattern must name a plugin, as plugin-id:*')
    })

    it('accepts a colon-less exact id, as core commands carry no namespace', () => {
      expect(AllowList.validate('daily-notes')).toBeNull()
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

  describe('when the covering entry is asked for', () => {
    const list = new AllowList(['shopping:add', 'daily-notes:*'])

    it('names the exact entry when an id is listed literally', () => {
      expect(list.coveringEntry('shopping:add')).toBe('shopping:add')
    })

    it('names the pattern when a pattern permitted the id', () => {
      expect(list.coveringEntry('daily-notes:goto-today')).toBe('daily-notes:*')
    })

    it('names nothing when no entry permits the id', () => {
      expect(list.coveringEntry('editor:toggle-bold')).toBeNull()
    })

    it('refuses the id through permits when no entry covers it', () => {
      expect(list.permits('editor:toggle-bold')).toBe(false)
    })
  })
})
