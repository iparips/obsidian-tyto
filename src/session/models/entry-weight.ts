import { Entry } from './panel-state'

export type EntryWeight = 'utterance' | 'reply' | 'context'

const WEIGHTS: Record<Entry['kind'], EntryWeight> = {
  user: 'utterance',
  assistant: 'reply',
  answer: 'reply',
  error: 'reply',
  cancelled: 'reply',
  choice: 'reply',
  question: 'reply',
  instructions: 'context',
  command: 'context',
  warning: 'context',
  steps: 'context',
}

// What an entry is worth on screen, which is not what it says. Six kinds are
// replies and two are context, so the panel reads as a conversation rather than
// as eight kinds of box.
export class EntryWeights {
  static of(kind: Entry['kind']): EntryWeight {
    return WEIGHTS[kind]
  }
}
