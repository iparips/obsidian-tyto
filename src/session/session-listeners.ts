import { Listeners } from './listeners'

export interface AnswerReport {
  text: string
  sources: string[]
}

// The two channels release 4 adds beside the instruction channel: a command
// entry and an answer entry, each reaching the panel as its own kind.
export class SessionListeners {
  readonly commandRuns = new Listeners<string>()
  readonly answers = new Listeners<AnswerReport>()
  readonly retargets = new Listeners<string>()
}
