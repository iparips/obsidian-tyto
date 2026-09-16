import { describe, expect, it } from 'vitest'
import { SessionLeaf } from '../session-leaf'
import { SessionView } from '../../session/views/obsidian/session-view'
import { FakeSessionWorkspace } from '../../test-support/fake-session-workspace'

const sessionView = (): SessionView => new SessionView({} as never)

describe('SessionLeaf', () => {
  describe('when a leaf already holds the session', () => {
    it('reveals the leaf it found rather than opening a second one', async () => {
      const view = sessionView()
      const workspace = new FakeSessionWorkspace().withSessionLeaf(view)

      const revealed = await new SessionLeaf(workspace.asApp()).reveal()

      expect(revealed).toBe(view)
      expect(workspace.getLeavesOfType('tyto-session')).toHaveLength(1)
    })
  })

  describe('when no leaf holds the session yet', () => {
    it('builds one in the sidebar and reveals it', async () => {
      const view = sessionView()
      const workspace = new FakeSessionWorkspace().withRightLeaf(view)

      const revealed = await new SessionLeaf(workspace.asApp()).reveal()

      expect(revealed).toBe(view)
      expect(workspace.revealed).toHaveLength(1)
    })
  })

  describe('when the sidebar has no leaf to give', () => {
    it('reveals nothing, so the caller binds no session', async () => {
      const workspace = new FakeSessionWorkspace().withoutRightLeaf()

      const revealed = await new SessionLeaf(workspace.asApp()).reveal()

      expect(revealed).toBeNull()
      expect(workspace.revealed).toEqual([])
    })
  })

  describe('when the panel is on screen', () => {
    it('reports itself visible, so a notice stays in the panel', () => {
      const workspace = new FakeSessionWorkspace().withSessionLeaf(sessionView())

      expect(new SessionLeaf(workspace.asApp()).isVisible()).toBe(true)
    })
  })

  describe('when the drawer is closed or another tab is in front', () => {
    it('reports itself hidden, so a notice reaches the user another way', () => {
      const workspace = new FakeSessionWorkspace().withSessionLeaf(sessionView(), false)

      expect(new SessionLeaf(workspace.asApp()).isVisible()).toBe(false)
    })
  })

  describe('when no leaf holds the session', () => {
    it('reports itself hidden rather than reading a leaf that is not there', () => {
      expect(new SessionLeaf(new FakeSessionWorkspace().asApp()).isVisible()).toBe(false)
    })
  })
})
