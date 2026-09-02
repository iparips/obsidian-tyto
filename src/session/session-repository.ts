import { TFile } from 'obsidian'
import { ChatMessage } from '../providers/types'

// The state one session carries across its turns. Queried and updated only
// through here, so no tool moves the target note in passing.
export class SessionRepository {
  private targetPath: string
  private readonly messages: ChatMessage[] = []

  constructor(private readonly originalNote: TFile) {
    this.targetPath = originalNote.path
  }

  targetNote(): string {
    return this.targetPath
  }

  changeTargetNote(path: string): void {
    this.targetPath = path
  }

  // Leaves the conversation intact, unlike a reset (FR20).
  resetTargetNoteToOriginal(): void {
    this.targetPath = this.originalNote.path
  }

  chatHistory(): readonly ChatMessage[] {
    return this.messages
  }

  appendChatMessage(message: ChatMessage): void {
    this.messages.push(message)
  }
}
