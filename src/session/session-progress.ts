import { Notice } from 'obsidian'
import { AgentsMdChain } from '../agents/agents-md-chain'
import { InstructionReport } from '../agents/instruction-report'
import { SessionListeners } from './session-listeners'
import { TurnProgressPublisher } from '../engine/turn-progress-publisher'
import { ProgressLine } from '../engine/progress-line'
import { TranscriptRepository } from './transcript/transcript-repository'

// Where each thing a turn narrates lands. A skill and a resolved chain join the
// numbered steps rather than sitting beside them, so the list reads in the order
// the turn actually ran. A drop also reaches a Notice.
export class SessionProgress {
  // A command that retargets resolves the chain again, so the last report is
  // held to keep an unchanged chain from printing twice.
  private lastReported: InstructionReport | null = null

  // Every progress line passes through publishProgressLine, which is what
  // advances the open turn step's range, so the engine's publish path is
  // untouched.
  constructor(
    private session: SessionListeners,
    private transcriptRepository: TranscriptRepository = new TranscriptRepository(),
  ) {}

  publisher(): TurnProgressPublisher {
    return new TurnProgressPublisher(
      (text, sources) => this.session.answers.publish({ text, sources }),
      // One channel, read twice: the header names the note now, and the panel
      // dispatches its own entry off the same subscription. Not a step, since a
      // retarget belongs to the moment rather than to the turn that was open.
      (path, byUser) => this.session.retargets.publish({ path, byUser }),
      (chain) => this.reportInstructions(chain),
      // Published as a step rather than a line beside the list: loading a skill
      // is one of the things the turn did, and its place in the order is what
      // says whether it happened before the edit.
      (name) => this.publishStep(ProgressLine.skillLoaded(name)),
      (text) => this.session.warnings.publish(text),
      (step) => this.publishStep(step),
    )
  }

  private publishStep(step: ProgressLine): void {
    this.transcriptRepository.progressLinePublished()
    this.session.steps.publish({
      label: step.label,
      detail: step.detail,
      refused: step.refused,
      note: step.note,
      wroteDirect: step.wroteDirect,
    })
  }

  // The two channels a drop reaches the user through: the panel entry, and one
  // Notice per resolved chain (FR10, FR14-16).
  private reportInstructions(chain: AgentsMdChain): void {
    const report = InstructionReport.of(chain)
    if (report.isEmpty() || report.sameAs(this.lastReported)) return
    this.publishStep(ProgressLine.instructionsApplied(report.stepText()))
    this.lastReported = report
    if (!chain.hasDrops()) return
    new Notice(report.noticeText())
  }
}
