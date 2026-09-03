import { Notice } from 'obsidian'
import { AgentsMdChain } from '../agents/agents-md-chain'
import { InstructionReport } from '../agents/instruction-report'
import { InstructionListeners } from './instruction-listeners'
import { SessionListeners } from './session-listeners'
import { TurnProgressPublisher } from '../engine/turn-progress-publisher'

// Where each thing a turn narrates lands: two become panel entries, one names
// the target note in the header (FR19), and a resolved chain also reaches a
// Notice and the console.
export class SessionProgress {
  // A command that retargets resolves the chain again, so the last report is
  // held to keep an unchanged chain from printing twice.
  private lastReported: InstructionReport | null = null

  constructor(
    private session: SessionListeners,
    private instructions: InstructionListeners,
  ) {}

  publisher(): TurnProgressPublisher {
    return new TurnProgressPublisher(
      (text) => this.session.commandRuns.publish(text),
      (text, sources) => this.session.answers.publish({ text, sources }),
      (path) => this.session.retargets.publish(path),
      (chain) => this.reportInstructions(chain),
      (name) => this.session.commandRuns.publish(`Skill applied: ${name}`),
      (text) => this.session.warnings.publish(text),
      (step) =>
        this.session.steps.publish({
          label: step.label,
          detail: step.detail,
          refused: step.refused,
        }),
    )
  }

  // The three channels a drop reaches the user through: the panel entry, one
  // Notice per resolved chain, and a console line naming every file
  // (FR10, FR14-16).
  private reportInstructions(chain: AgentsMdChain): void {
    const report = InstructionReport.of(chain)
    if (report.isEmpty() || report.sameAs(this.lastReported)) return
    this.instructions.publish(report.panelText())
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
