import { App, Modal, Setting } from 'obsidian'

export class RebindModal extends Modal {
  constructor(
    app: App,
    private currentNoteName: string,
    private newNoteName: string,
    private onRebind: () => void,
  ) {
    super(app)
  }

  onOpen(): void {
    this.contentEl.createEl('p', {
      text: `A session is running for ${this.currentNoteName}. Start over with ${this.newNoteName}? Starting over drops the current conversation.`,
    })
    new Setting(this.contentEl)
      .addButton((button) =>
        button.setButtonText('Keep current session').onClick(() => this.close()),
      )
      .addButton((button) =>
        button
          .setButtonText('Start over')
          .setCta()
          .onClick(() => {
            this.close()
            this.onRebind()
          }),
      )
  }

  onClose(): void {
    this.contentEl.empty()
  }
}
