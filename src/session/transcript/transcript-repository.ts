import {
  PartName,
  RecordedEnding,
  RecordedTurnStep,
  StepCharge,
  StepRange,
  TranscriptPart,
} from './models/transcript-record'
import { TurnEndingKind } from '../../engine/turn/ending/turn-ending-kind'
import { RestoredCounts } from './models/restored-counts'

// What a part was last recorded as, so an unchanged text is cited rather than
// stored again.
interface KeptPart {
  version: number
  text: string
}

// Session-scoped, built and reset beside SessionRepository: a recorded step
// indexes into that history, so the two are only meaningful together. Holds
// what each turn step was sent, dropping whatever it shared with the step
// before it.
export class TranscriptRepository {
  private readonly steps: RecordedTurnStep[] = []
  private readonly endings: RecordedEnding[] = []
  private readonly kept = new Map<PartName, KeptPart>()
  private readonly versions: TranscriptPart[] = []
  private publishedProgressLines: number
  private turn: number

  // Where a restored session picks up in each of the three things a step
  // indexes into. Zero throughout for a session that never went away; for one
  // that came back, what the record already holds. Without them the first step
  // after a restore claims the previous session's messages, progress lines and
  // turn number as its own.
  constructor(private readonly restored: RestoredCounts = RestoredCounts.none()) {
    this.publishedProgressLines = restored.progressLines
    this.turn = restored.turns
  }

  // Called before the provider call, so the parts recorded are the ones that
  // call carried rather than what the next step will change them to.
  recordCall(parts: ReadonlyMap<PartName, string>, historyLength: number): void {
    this.closeOpenStep()
    const step = new RecordedTurnStep(
      this.turn,
      this.stepsThisTurn(),
      [...parts].map(([name, text]) => this.versionOf(name, text)),
      new StepRange(this.historyStart(), historyLength - 1),
      new StepRange(this.publishedProgressLines, this.publishedProgressLines - 1),
    )
    this.steps.push(step)
  }

  // Called from ConversationTurnRunner once the calls have run and the counter
  // has taken them, so the open step is the one that sent them. A charge with no
  // open step is a harness defect rather than a crash, and records nothing.
  recordCharge(charge: StepCharge): void {
    const open = this.steps.at(-1)
    if (!open) return
    this.steps[this.steps.length - 1] = open.withCharge(charge)
  }

  // Closes the open step's panel range, so the steps the last tool calls
  // published belong to the step that asked for them.
  recordEnding(kind: TurnEndingKind): void {
    this.closeOpenStep()
    this.endings.push(new RecordedEnding(this.turn, kind, this.stepsThisTurn() - 1))
    this.turn += 1
  }

  // Advanced from SessionProgress as each progress line is published, so the
  // engine's publish path, PanelAction and PanelReducer are untouched.
  progressLinePublished(): void {
    this.publishedProgressLines += 1
  }

  recordedSteps(): readonly RecordedTurnStep[] {
    return this.steps.map((step, index) => this.closedAt(step, index))
  }

  recordedEndings(): readonly RecordedEnding[] {
    return this.endings
  }

  // Every version of every part, in the order they were first sent, which is
  // the order the appendix writes them.
  recordedParts(): readonly TranscriptPart[] {
    return this.versions
  }

  isEmpty(): boolean {
    return this.steps.length === 0
  }

  // The open step owns everything published since it was recorded, so its range
  // runs to whatever has landed by the time the transcript is read.
  private closedAt(step: RecordedTurnStep, index: number): RecordedTurnStep {
    if (index < this.steps.length - 1) return step
    return step.withProgressLines(step.progressLines.extendedTo(this.publishedProgressLines - 1))
  }

  private closeOpenStep(): void {
    const open = this.steps.at(-1)
    if (!open) return
    this.steps[this.steps.length - 1] = this.closedAt(open, this.steps.length - 1)
  }

  // Distinct text is what makes a version, so a session that loads a skill
  // partway keeps two system prompts rather than one per step.
  private versionOf(name: PartName, text: string): TranscriptPart {
    const kept = this.kept.get(name)
    if (kept && kept.text === text) return new TranscriptPart(name, kept.version, text)
    const part = new TranscriptPart(name, (kept?.version ?? 0) + 1, text)
    this.kept.set(name, { version: part.version, text })
    this.versions.push(part)
    return part
  }

  private stepsThisTurn(): number {
    return this.steps.filter((step) => step.turn === this.turn).length
  }

  // Each step names only what is new since the one before, so the export walks
  // the history once and writes no message twice.
  private historyStart(): number {
    const previous = this.steps.at(-1)
    return previous ? previous.history.last + 1 : this.restored.messages
  }
}
