// The notes the user has approved opening, held for the session rather than the
// turn. A command can move the target off an approved note mid-turn, and asking
// again for a note the user already said yes to reads as the panel forgetting.
export class ApprovalRepository {
  private readonly paths = new Set<string>()

  // Per path rather than one flag: a session that opens a second, different
  // note asks again, which keeps the approval about a note rather than a mode.
  includes(path: string): boolean {
    return this.paths.has(path)
  }

  record(path: string): void {
    this.paths.add(path)
  }
}
