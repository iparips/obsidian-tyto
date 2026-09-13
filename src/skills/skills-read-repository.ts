// Session-scoped because the body stays in the chat history, so a name here
// means the model can still read the steps. If the history is ever truncated,
// this record moves with it.
export class SkillsReadRepository {
  private readonly names = new Set<string>()

  recordNameRead(name: string): void {
    this.names.add(name)
  }

  includesNameRead(name: string): boolean {
    return this.names.has(name)
  }

  // A copy, so a caller holds values rather than this repository.
  getNamesRead(): readonly string[] {
    return [...this.names]
  }
}
