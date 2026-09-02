import { AgentsMdChain } from './agents-md-chain'

// What one turn's chain resolved to, in the shape the panel and the notice
// read. A value object, so the repository reports and main.ts decides how to
// surface it (FR10, FR14, FR15).
export class InstructionReport {
  constructor(
    readonly applied: readonly string[],
    readonly droppedCount: number,
  ) {}

  static of(chain: AgentsMdChain): InstructionReport {
    return new InstructionReport(
      chain.files.map((file) => file.label()),
      chain.dropped.length,
    )
  }

  isEmpty(): boolean {
    return this.applied.length === 0 && this.droppedCount === 0
  }

  panelText(): string {
    return [`Instructions applied: ${this.appliedText()}`, ...this.dropText()].join(' ')
  }

  noticeText(): string {
    return `Owl: ${this.droppedCount} instruction file(s) dropped; the chain was over the size limit.`
  }

  private appliedText(): string {
    return this.applied.length === 0 ? 'none' : this.applied.join(', ')
  }

  private dropText(): string[] {
    return this.droppedCount === 0 ? [] : [`(${this.droppedCount} dropped over the size limit)`]
  }
}
