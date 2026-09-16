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
  retargeted: 'context',
}

// What an entry is worth on screen, which is not what it says. Six kinds are
// replies and four are context, so the panel reads as a conversation rather
// than as eleven kinds of box.
export class EntryWeights {
  static of(kind: PanelEntry['kind']): EntryWeight {
    return WEIGHTS[kind]
  }
}
