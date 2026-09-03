import { Notice } from 'obsidian'
import { AgentsMdChain } from '../agents/agents-md-chain'
import { InstructionReport } from '../agents/instruction-report'
import { SessionListeners } from './session-listeners'
import { TurnProgressPublisher } from '../engine/turn-progress-publisher'
import { TurnStep } from '../engine/models/turn-step'

// Where each thing a turn narrates lands. A skill and a resolved chain join the
// numbered steps rather than sitting beside them, so the list reads in the order
// the turn actually ran. A drop also reaches a Notice and the console.
export class SessionProgress {
  // A command that retargets resolves the chain again, so the last report is
  // held to keep an unchanged chain from printing twice.
  private lastReported: InstructionReport | null = null

  constructor(private session: SessionListeners) {}

  publisher(): TurnProgressPublisher {
    return new TurnProgressPublisher(
      (text, sources) => this.session.answers.publish({ text, sources }),
      (path) => this.session.retargets.publish(path),
      (chain) => this.reportInstructions(chain),
      // Published as a step rather than a line beside the list: loading a skill
      // is one of the things the turn did, and its place in the order is what
      // says whether it happened before the edit.
      (name) => this.publishStep(TurnStep.skillLoaded(name)),
      (text) => this.session.warnings.publish(text),
      (step) => this.publishStep(step),
    )
  }

  private publishStep(step: TurnStep): void {
    this.session.steps.publish({
      label: step.label,
      detail: step.detail,
      refused: step.refused,
    })
  }

  // The three channels a drop reaches the user through: the panel entry, one
  // Notice per resolved chain, and a console line naming every file
  // (FR10, FR14-16).
  private reportInstructions(chain: AgentsMdChain): void {
    const report = InstructionReport.of(chain)
    if (report.isEmpty() || report.sameAs(this.lastReported)) return
    this.publishStep(TurnStep.instructionsApplied(report.stepText()))
    this.lastReported = report
    if (!chain.hasDrops()) return
    new Notice(report.noticeText())
    SessionProgress.logDrops(chain)
  }

  private static logDrops(chain: AgentsMdChain): void {
    chain.dropped.forEach((file) =>
      console.debug('[owl] instruction file dropped:', file.fileName, 'in', file.label()),
    )
  }
}
