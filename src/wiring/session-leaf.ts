import { App, WorkspaceLeaf } from 'obsidian'
import { SessionView, VIEW_TYPE_SESSION } from '../session/views/obsidian/session-view'

// The workspace side of the panel: finding the leaf holding the session, and
// putting it in front of the user. Everything here reads app.workspace, which
// is why it sits apart from what needs the plugin's own lifecycle methods.
export class SessionLeaf {
  constructor(private app: App) {}

  // Null leaves the caller with no session to bind rather than a half-built one.
  async reveal(): Promise<SessionView | null> {
    const leaf = await this.leaf()
    // In exceptional cases, Obsidian gives no sidebar leaf, so there is
    // nothing to reveal and nothing to build a session in.
    if (!leaf) return null
    await this.app.workspace.revealLeaf(leaf)
    return leaf.view instanceof SessionView ? leaf.view : null
  }

  // isShown is false when the drawer is closed and when another tab of the
  // sidebar is in front of it.
  isVisible(): boolean {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_SESSION)[0]
    return leaf?.view.containerEl.isShown() ?? false
  }

  // Awaited, since setViewState is what builds the view: returning before it
  // settles hands back a leaf whose view is not a SessionView yet.
  private async leaf(): Promise<WorkspaceLeaf | null> {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_SESSION)[0]
    if (existing) return existing
    const leaf = this.app.workspace.getRightLeaf(false)
    await leaf?.setViewState({ type: VIEW_TYPE_SESSION, active: true })
    return leaf
  }
}
