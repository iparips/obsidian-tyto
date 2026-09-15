import { App } from 'obsidian'

// Which markdown note is in front of the user, asked at the moment a binding is
// decided rather than reconstructed from the file-open events that led there.
export class ActiveNote {
  constructor(private app: App) {}

  // Null for anything but a note, so a session with a canvas, a PDF or a Bases
  // file in front is unbound rather than bound to something no editor can show.
  path(): string | null {
    const file = this.app.workspace.getActiveFile()
    return file?.extension === 'md' ? file.path : null
  }
}
