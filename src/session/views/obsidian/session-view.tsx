import { ItemView, WorkspaceLeaf } from 'obsidian'
import { createRoot, Root } from 'react-dom/client'
import { SessionPanel, SessionPanelProps } from '../SessionPanel'
import { TYTO_ICON } from './tyto-icon'
import { entryMarkdownRender } from './entry-markdown-render'
import { MarkdownRenderFn } from '../markdown-render'

export const VIEW_TYPE_SESSION = 'tyto-session'

// What the view cannot answer for itself: whether a session was left behind,
// and what its props are. Only the plugin reaches the store. It takes the view
// back because a session's props carry the action that rebinds this view.
export type RestoreSessionFn = (view: SessionView) => Promise<SessionPanelProps | null>

export class SessionView extends ItemView {
  private root: Root | null = null
  // Built on first render rather than as a field, so it reads this.app after
  // ItemView's constructor has set it. Held after that, because a new function
  // each render would restart every entry through the effect depending on it.
  private markdownRender: MarkdownRenderFn | null = null
  private panelProps: SessionPanelProps | null = null
  // Bumped on every bind, and the panel's whole key, so an unbound session needs
  // no note name to remount and clear the entries on screen.
  private sessionCount = 0
  // The restore onOpen started, so a caller reaching the view mid-open waits for
  // it rather than reading hasSession while the store read is still in flight.
  private opening: Promise<void> | null = null

  constructor(
    leaf: WorkspaceLeaf,
    // Absent for a view built before the plugin can restore, which renders
    // empty as it did before.
    private restoreSessionFn?: RestoreSessionFn,
  ) {
    super(leaf)
  }

  getViewType(): string {
    return VIEW_TYPE_SESSION
  }

  getDisplayText(): string {
    return 'Tyto session'
  }

  getIcon(): string {
    return TYTO_ICON
  }

  bindSession(props: SessionPanelProps): void {
    this.panelProps = props
    this.sessionCount += 1
    this.renderPanel()
  }

  // Read by the suite rather than by the plugin, which stopped comparing note
  // names once the binding started coming from the workspace. It is how a test
  // tells one bound session from another.
  boundNoteName(): string | null {
    return this.panelProps?.noteName ?? null
  }

  hasSession(): boolean {
    return this.panelProps !== null
  }

  // Obsidian reopens the leaf itself on restart, so a session left behind must
  // come back here rather than waiting for the user to invoke Tyto again. A
  // sidebar that reads empty until you know to re-open it is the failure FR4
  // names.
  async onOpen(): Promise<void> {
    this.opening = this.restoreStoredSession()
    return this.opening
  }

  // Settles once the session left behind is back, or once there is none. The
  // plugin waits on this before it decides the panel is empty: Obsidian does not
  // await setViewState, so a leaf revealed by the ribbon is still opening.
  async whenOpened(): Promise<void> {
    await this.opening
  }

  private async restoreStoredSession(): Promise<void> {
    this.root = createRoot(this.contentEl)
    this.renderPanel()
    if (this.panelProps) return
    const restored = await this.restoreSessionFn?.(this)
    // Checked again: the user may have started a session while the read was in
    // flight, and a restore must not replace one they are already using.
    if (restored && !this.panelProps) this.bindSession(restored)
  }

  async onClose(): Promise<void> {
    this.root?.unmount()
    this.root = null
    this.panelProps = null
    this.opening = null
  }

  private renderMarkdownFn(): MarkdownRenderFn {
    this.markdownRender ??= entryMarkdownRender(this.app)
    return this.markdownRender
  }

  private renderPanel(): void {
    if (!this.root) return
    if (!this.panelProps) return
    const key = `session-${this.sessionCount}`
    // Supplied here rather than by wiring: the renderer needs the app, and the
    // view is the only part of the panel that already holds one.
    this.root.render(
      <SessionPanel key={key} {...this.panelProps} renderMarkdownFn={this.renderMarkdownFn()} />,
    )
  }
}
