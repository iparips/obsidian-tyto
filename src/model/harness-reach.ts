import { AllowedObsidianCommand } from '../commands/models/allowed-obsidian-command'

// What the harness lets a turn reach, as the prompt needs to state it. A value
// rather than the service, so building the messages needs no collaborator.
export class HarnessReach {
  constructor(
    readonly allowedCommands: readonly AllowedObsidianCommand[],
    readonly searchEnabled: boolean,
  ) {}

  hasCommands(): boolean {
    return this.allowedCommands.length > 0
  }
}
