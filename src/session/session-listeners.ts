import { Listeners } from './listeners'

export interface AnswerReport {
  text: string
  sources: string[]
}

// The channels release 4 adds beside the instruction channel: a command entry,
// an answer entry and the header's target, each reaching the panel as its own
// kind. The open question is not one of them: it reads an answer back, which is
// what the publisher's one-way channels cannot do.
export class SessionListeners {
  readonly commandRuns = new Listeners<string>()
  readonly answers = new Listeners<AnswerReport>()
  readonly retargets = new Listeners<string>()
  readonly warnings = new Listeners<string>()
  readonly steps = new Listeners<StepReport>()
}

export interface StepReport {
  label: string
  detail: string
  refused: boolean
}

// One asker per session, held so the plugin can hand the engine a question
// before the panel has subscribed to it (NFR5). Unlike the channels above, it
// reads an answer back, which is what the publisher's one-way callbacks cannot
// do.
export class Asker<Request, Answer> {
  private askPanel: ((request: Request) => Promise<Answer>) | null = null

  constructor(private whenNobodyListens: Answer) {}

  subscribe(listener: (request: Request) => Promise<Answer>): () => void {
    this.askPanel = listener
    return () => (this.askPanel = null)
  }

  // A question nobody can see is one nobody answered, so the fallback stands in
  // rather than the turn parking on a promise no panel will settle (NFR1).
  ask(request: Request): Promise<Answer> {
    return this.askPanel?.(request) ?? Promise.resolve(this.whenNobodyListens)
  }
}
