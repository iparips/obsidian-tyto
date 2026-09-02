import { AgentsMdFile } from './agents-md-file'

// files are in prompt order, root first. dropped are the ones the cap excluded,
// carried so the top level can report them rather than the repository logging.
export class AgentsMdChain {
  constructor(
    readonly files: readonly AgentsMdFile[] = [],
    readonly dropped: readonly AgentsMdFile[] = [],
  ) {}

  isEmpty(): boolean {
    return this.files.length === 0
  }

  hasDrops(): boolean {
    return this.dropped.length > 0
  }
}
