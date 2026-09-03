import { AllowedCommand } from './allowed-command'

// A command beside the entry covering it, so the picker can say what is already
// allowed and by what (FR6).
export class CommandMatch {
  constructor(
    readonly command: AllowedCommand,
    readonly coveredBy: string | null,
  ) {}

  isCovered(): boolean {
    return this.coveredBy !== null
  }
}
