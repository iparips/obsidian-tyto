import { DataAdapter } from 'obsidian'
import { STORED_SESSION_VERSION, StoredSession } from './models/stored-session'

const SESSION_FILE = 'session.json'

// The one component that knows a session can outlive the app. Every failure
// path returns nothing rather than throwing: a session that cannot be read is a
// session that was not there, and the plugin must load either way (FR9, FR10).
export class SessionStore {
  // Optional in the Obsidian typings, and an absent one means no session is
  // stored: the store reads and writes nothing rather than guessing a path.
  constructor(
    private adapter: DataAdapter,
    private pluginFolder: string | undefined,
  ) {}

  async read(): Promise<StoredSession | null> {
    const path = this.sessionPath()
    if (!path) return null
    const stored = await this.parse(path)
    if (!stored) return null
    if (stored.version !== STORED_SESSION_VERSION) return this.discardOutdated(path)
    return stored
  }

  // Never awaited by a turn, and silent on failure: the turn it was recording
  // has already happened (NFR3).
  async write(session: StoredSession): Promise<void> {
    const path = this.sessionPath()
    if (!path) return
    try {
      await this.adapter.write(path, JSON.stringify(session))
    } catch {
      console.debug('[tyto] could not write the session')
    }
  }

  async discard(): Promise<void> {
    const path = this.sessionPath()
    if (!path) return
    await this.remove(path)
  }

  private async parse(path: string): Promise<StoredSession | null> {
    try {
      return JSON.parse(await this.adapter.read(path)) as StoredSession
    } catch {
      return null
    }
  }

  private async discardOutdated(path: string): Promise<null> {
    await this.remove(path)
    return null
  }

  private async remove(path: string): Promise<void> {
    try {
      await this.adapter.remove(path)
    } catch {
      console.debug('[tyto] no stored session to remove')
    }
  }

  private sessionPath(): string | null {
    return this.pluginFolder ? `${this.pluginFolder}/${SESSION_FILE}` : null
  }
}
