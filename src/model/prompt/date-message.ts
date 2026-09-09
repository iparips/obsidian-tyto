import { ChatMessage } from '../providers/types'
import { Today } from '../today'

// Sent near the note rather than with the opening message, because it goes
// stale the same way the note does: the chat history holds yesterday's copy,
// and this is the only current one.
export class DateMessage {
  static build(today: Today = Today.of()): ChatMessage {
    return ChatMessage.system(
      [
        `Today is ${today.describe()}.`,
        'Resolve every relative date in the instruction against it, never against',
        'a date in the conversation or a note name. A note named for a date is not',
        'evidence of what today is.',
      ].join('\n'),
    )
  }
}
