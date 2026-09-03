import { Notice } from 'obsidian'

const FADES_AFTER_MS = 6000

// The call to action is part of the text rather than styling, so it reads the
// same on both surfaces and needs no CSS to be understood (FR25, FR26).
const TAP_TO_ANSWER = 'Tap to answer.'
const TAP_TO_VIEW = 'Tap to view.'

// Owns telling a user whose panel is closed. Holds the open notice so a waiting
// one is dismissed when its answer arrives rather than on a timer (FR21).
export class TurnNotices {
  private waitingNotice: Notice | null = null

  constructor(
    // Only the plugin can answer whether the session leaf is showing, and only
    // the user's own click may open it (FR27).
    private panelIsVisible: () => boolean,
    private revealPanel: () => void,
  ) {}

  waiting(question: string): void {
    this.waitingNotice = this.show(`${question} ${TAP_TO_ANSWER}`, 0)
  }

  finished(summary: string): void {
    this.show(`${summary} ${TAP_TO_VIEW}`, FADES_AFTER_MS)
  }

  failed(message: string): void {
    this.show(`Owl failed: ${message} ${TAP_TO_VIEW}`, FADES_AFTER_MS)
  }

  // Dismissed when the answer arrives rather than on a timer, which is what
  // separates a waiting notice from the two that fade (FR21).
  dismiss(): void {
    this.waitingNotice?.hide()
    this.waitingNotice = null
  }

  // Nothing when the panel is showing: a visible panel is the notification, and
  // a notice would only repeat it (NFR9).
  private show(text: string, duration: number): Notice | null {
    if (this.panelIsVisible()) return null
    const notice = new Notice(text, duration)
    notice.messageEl.addEventListener('click', () => this.reveal(notice))
    return notice
  }

  private reveal(notice: Notice): void {
    notice.hide()
    this.revealPanel()
  }
}
