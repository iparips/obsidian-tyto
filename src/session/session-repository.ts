import { TFile } from 'obsidian'
import { ChatMessage } from '../model/providers/types'

// The state one session carries across its turns. Queried and updated only
// through here, so no tool moves the target note in passing.
export class SessionRepository {
  private targetPath: string | null
  private readonly messages: ChatMessage[] = []

  constructor(originalNote: TFile | null) {
    this.targetPath = originalNote?.path ?? null
  }

  // From a stored path rather than a TFile, since the note a restored session
  // was on may no longer be open or may no longer exist (FR7).
  static restored(targetPath: string | null, messages: readonly ChatMessage[]): SessionRepository {
    const sessions = new SessionRepository(null)
    sessions.targetPath = targetPath
    messages.forEach((message) => sessions.appendChatMessage(message))
    return sessions
  }

  // Null until the user opens a note, which is what an unbound session is.
  targetNote(): string | null {
    return this.targetPath
  }

  isBound(): boolean {
    return this.targetPath !== null
  }

  // Null when nothing markdown is open, which is an unbound session. Every
  // caller can produce one: the workspace at assemble time, and a file-open
  // carrying a canvas or an empty tab.
  bindTo(path: string | null): void {
    this.targetPath = path
  }

  chatHistory(): readonly ChatMessage[] {
    return this.messages
  }

  appendChatMessage(message: ChatMessage): void {
    this.messages.push(message)
  }
}
