import { PanelEntry } from './panel-state'

export type EntryWeight = 'utterance' | 'reply' | 'context'

const WEIGHTS: Record<PanelEntry['kind'], EntryWeight> = {
  user: 'utterance',
  assistant: 'reply',
  answer: 'reply',
  error: 'reply',
  cancelled: 'reply',
  choice: 'reply',
  question: 'reply',
  instructions: 'context',
  warning: 'context',
  steps: 'context',
  restored: 'context',
}

// What an entry is worth on screen, which is not what it says. Six kinds are
// replies and three are context, so the panel reads as a conversation rather
// than as ten kinds of box.
export class EntryWeights {
  static of(kind: PanelEntry['kind']): EntryWeight {
    return WEIGHTS[kind]
  }
}
