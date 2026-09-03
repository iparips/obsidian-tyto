import { beforeEach, describe, expect, it } from 'vitest'
import { ApprovalRepository } from '../approval-repository'

const TODO = 'Journal/todo.md'

describe('ApprovalRepository', () => {
  let approved: ApprovalRepository

  beforeEach(() => {
    approved = new ApprovalRepository()
  })

  describe('when nothing has been approved', () => {
    it('excludes every path when nothing has been approved', () => {
      expect(approved.includes(TODO)).toBe(false)
    })
  })

  describe('when a path has been approved', () => {
    beforeEach(() => {
      approved.record(TODO)
    })

    it('includes a path the user approved', () => {
      expect(approved.includes(TODO)).toBe(true)
    })

    it('excludes a path the user did not approve', () => {
      expect(approved.includes('Lists/shopping.md')).toBe(false)
    })
  })
})
