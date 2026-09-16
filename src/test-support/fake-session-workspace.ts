import { App } from 'obsidian'
import { SessionView } from '../session/views/obsidian/session-view'

// The workspace as SessionLeaf sees it: leaves of the session's own type, a
// right leaf to build one in, and a record of what was revealed. Separate from
// FakeWorkspace, which answers for markdown leaves and the active note.
export class FakeSessionWorkspace {
  // What the test asserts SessionLeaf put in front of the user.
  readonly revealed: unknown[] = []
  private leaves: unknown[] = []
  private rightLeaf: unknown = null

  asApp(): App {
    return { workspace: this } as unknown as App
  }

  // A leaf already holding a session, as Obsidian reopens on restart.
  withSessionLeaf(view: SessionView, shown = true): this {
    this.leaves.push({ view: Object.assign(view, { containerEl: { isShown: () => shown } }) })
    return this
  }

  // The sidebar slot a new session is built into. setViewState is what mounts
  // the view, so the leaf holds one only once it has been called.
  withRightLeaf(view: SessionView): this {
    const leaf: Record<string, unknown> = {
      setViewState: () => {
        leaf.view = view
        this.leaves.push(leaf)
        return Promise.resolve()
      },
    }
    this.rightLeaf = leaf
    return this
  }

  // The case where Obsidian has no sidebar slot to give, which leaves the
  // caller with no view to bind.
  withoutRightLeaf(): this {
    this.rightLeaf = null
    return this
  }

  getLeavesOfType(type: string): unknown[] {
    return type === 'tyto-session' ? [...this.leaves] : []
  }

  // Nothing open, which is the unbound session a test building one gets. The
  // note a session binds to is FakeWorkspace's subject, not this one's.
  getActiveFile(): null {
    return null
  }

  getRightLeaf(_newLeaf: boolean): unknown {
    return this.rightLeaf
  }

  revealLeaf(leaf: unknown): Promise<void> {
    this.revealed.push(leaf)
    return Promise.resolve()
  }
}
