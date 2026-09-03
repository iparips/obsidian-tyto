import { ItemView, WorkspaceLeaf } from 'obsidian'
import { createRoot, Root } from 'react-dom/client'
import { SessionPanel, SessionPanelProps } from './SessionPanel'

export const VIEW_TYPE_SESSION = 'owl-session'

export class SessionView extends ItemView {
  private root: Root | null = null
  private panelProps: SessionPanelProps | null = null
  // Bumped on every bind, and the panel's whole key, so an unbound session needs
  // no note name to remount and clear the entries on screen.
  private sessionCount = 0

  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
  }

  getViewType(): string {
    return VIEW_TYPE_SESSION
  }

  getDisplayText(): string {
    return 'Owl session'
  }

  getIcon(): string {
    return 'mic'
  }

  bindSession(props: SessionPanelProps): void {
    this.panelProps = props
    this.sessionCount += 1
    this.renderPanel()
  }

  boundNoteName(): string | null {
    return this.panelProps?.noteName ?? null
  }

  hasSession(): boolean {
    return this.panelProps !== null
  }

  async onOpen(): Promise<void> {
    this.root = createRoot(this.contentEl)
    this.renderPanel()
  }

  async onClose(): Promise<void> {
    this.root?.unmount()
    this.root = null
    this.panelProps = null
  }

  private renderPanel(): void {
    if (!this.root) return
    if (!this.panelProps) return
    const key = `session-${this.sessionCount}`
    this.root.render(<SessionPanel key={key} {...this.panelProps} />)
  }
}
