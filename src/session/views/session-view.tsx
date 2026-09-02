import { ItemView, WorkspaceLeaf } from 'obsidian'
import { createRoot, Root } from 'react-dom/client'
import { SessionPanel, SessionPanelProps } from './SessionPanel'

export const VIEW_TYPE_SESSION = 'voice-edit-session'

export class SessionView extends ItemView {
  private root: Root | null = null
  private panelProps: SessionPanelProps | null = null

  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
  }

  getViewType(): string {
    return VIEW_TYPE_SESSION
  }

  getDisplayText(): string {
    return 'Voice edit session'
  }

  getIcon(): string {
    return 'mic'
  }

  bindSession(props: SessionPanelProps): void {
    this.panelProps = props
    this.renderPanel()
  }

  boundNoteName(): string | null {
    return this.panelProps?.noteName ?? null
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
    this.root.render(<SessionPanel key={this.panelProps.noteName} {...this.panelProps} />)
  }
}
