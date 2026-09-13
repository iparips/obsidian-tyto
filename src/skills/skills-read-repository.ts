// Session-scoped, so a skill read in one turn stays read for the rest of the
// session. It rests on the body staying in the chat history: a name recorded
// here means the model can still read the steps it was sent. If the history is
// ever truncated or summarised, this record moves with it.
export class SkillsReadRepository {
  private readonly names = new Set<string>()

  recordNameRead(name: string): void {
    this.names.add(name)
  }

  includesNameRead(name: string): boolean {
    return this.names.has(name)
  }
}
