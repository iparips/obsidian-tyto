import { AllowList } from './allow-list'
import { ObsidianCommandRegistry } from './obsidian-command-registry'
import { AllowedObsidianCommand } from './models/allowed-obsidian-command'

// Resolves the user's entries against the live command list every call, so a
// command registered after the pattern was written is matched without a
// settings edit (FR6).
export class ObsidianCommandCatalogue {
  constructor(
    private registry: ObsidianCommandRegistry,
    private allowList: AllowList,
  ) {}

  resolve(): readonly AllowedObsidianCommand[] {
    return this.registry.list().filter((command) => this.allowList.permits(command.id))
  }

  permits(commandId: string): boolean {
    return this.resolve().some((command) => command.id === commandId)
  }

  isReachable(): boolean {
    return this.registry.isReachable()
  }
}
