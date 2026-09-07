import { AllowedObsidianCommand } from './allowed-obsidian-command'

// A command beside the entry covering it, so the picker can say what is already
// allowed and by what (FR6).
export class ObsidianCommandMatch {
  constructor(
    readonly command: AllowedObsidianCommand,
    readonly coveredBy: string | null,
  ) {}

  isCovered(): boolean {
    return this.coveredBy !== null
  }
}
