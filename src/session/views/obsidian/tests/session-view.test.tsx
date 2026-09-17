import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkspaceLeaf } from 'obsidian'
import { SessionView } from '../session-view'
import { SessionPanelProps } from '../../SessionPanel'

// Obsidian reopens the leaf itself on restart, so onOpen is where a session
// left behind has to come back: the user has not invoked Tyto at that point.
describe('SessionView', () => {
  let view: SessionView
  let restored: SessionPanelProps

  const aPanelProps = (overrides: Partial<SessionPanelProps> = {}): SessionPanelProps =>
    ({
      noteName: 'day',
      recorder: { start: vi.fn(), stop: vi.fn(), cancel: vi.fn() },
      transcribe: vi.fn(),
      processUtterance: vi.fn(),
      onObsidianBackgrounded: () => () => undefined,
      ...overrides,
    }) as unknown as SessionPanelProps

  beforeEach(() => {
    restored = aPanelProps({ entries: [{ kind: 'user', text: 'add a heading' }] })
  })

  // onOpen mounts a React root, and every test here opens a view. Left mounted,
  // the scheduler flushes the commit through setImmediate after the environment
  // is torn down, and React reaches a window that is gone.
  afterEach(async () => {
    await view?.onClose()
  })

  describe('when the leaf reopens with a session left behind', () => {
    beforeEach(async () => {
      view = new SessionView({} as WorkspaceLeaf, () => Promise.resolve(restored))
      await view.onOpen()
    })

    it('binds the stored session when the leaf reopens', () => {
      expect(view.hasSession()).toBe(true)
    })

    it('names the restored note when the leaf reopens', () => {
      expect(view.boundNoteName()).toBe('day')
    })
  })

  describe('when no session was left behind', () => {
    beforeEach(async () => {
      view = new SessionView({} as WorkspaceLeaf, () => Promise.resolve(null))
      await view.onOpen()
    })

    it('holds no session when nothing was stored', () => {
      expect(view.hasSession()).toBe(false)
    })
  })

  describe('when the user starts a session while the read is in flight', () => {
    it('keeps the session the user started rather than replacing it', async () => {
      let settle: (props: SessionPanelProps | null) => void = () => undefined
      view = new SessionView(
        {} as WorkspaceLeaf,
        () => new Promise<SessionPanelProps | null>((resolve) => (settle = resolve)),
      )

      const opening = view.onOpen()
      view.bindSession(aPanelProps({ noteName: 'started by hand' }))
      settle(restored)
      await opening

      expect(view.boundNoteName()).toBe('started by hand')
    })
  })

  // Closing the panel nulls the props, and reopening starts the read again.
  // Obsidian does not await setViewState, so the plugin reaches the view while
  // that read is still in flight.
  describe('when the panel is reopened with a session left behind', () => {
    it('waits for the restore before reporting whether a session is bound', async () => {
      view = new SessionView(
        {} as WorkspaceLeaf,
        () =>
          new Promise<SessionPanelProps | null>((resolve) =>
            window.setTimeout(() => resolve(restored)),
          ),
      )

      void view.onOpen()
      await view.whenOpened()

      expect(view.hasSession()).toBe(true)
    })

    it('settles when nothing was left behind, so the caller binds a fresh session', async () => {
      view = new SessionView({} as WorkspaceLeaf, () => Promise.resolve(null))

      void view.onOpen()
      await view.whenOpened()

      expect(view.hasSession()).toBe(false)
    })

    it('settles before the view has opened, so a caller never waits on a closed panel', async () => {
      view = new SessionView({} as WorkspaceLeaf, () => Promise.resolve(restored))

      await view.whenOpened()

      expect(view.hasSession()).toBe(false)
    })
  })

  describe('when the view was built without a restore', () => {
    it('holds no session when nothing can restore one', async () => {
      view = new SessionView({} as WorkspaceLeaf)

      await view.onOpen()

      expect(view.hasSession()).toBe(false)
    })
  })
})
