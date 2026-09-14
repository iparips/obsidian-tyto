import { ChatMessage } from '../providers/types'

// The three messages one call carries besides the conversation, named so a
// reader of a transcript knows which is which. The history is not here: it
// already sits in SessionRepository, and a step cites the slice it was sent.
export class ModelRequestParts {
  constructor(
    readonly systemPrompt: ChatMessage,
    readonly dateMessage: ChatMessage,
    readonly sessionTarget: ChatMessage,
  ) {}

  // Ordered by how stale a copy the history could hold: the system prompt
  // first, then the conversation, then what the model must not read off an
  // earlier turn.
  asMessagesAround(chatHistory: readonly ChatMessage[]): ChatMessage[] {
    return [this.systemPrompt, ...chatHistory, this.dateMessage, this.sessionTarget]
  }
}
