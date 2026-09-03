import { AllowList } from './allow-list'
import { CommandRegistry } from './command-registry'
import { AllowedCommand } from './models/allowed-command'

// Resolves the user's entries against the live command list every call, so a
// command registered after the pattern was written is matched without a
// settings edit (FR6).
export class CommandCatalogue {
  constructor(
    private registry: CommandRegistry,
    private allowList: AllowList,
  ) {}

  resolve(): readonly AllowedCommand[] {
    return this.registry.list().filter((command) => this.allowList.permits(command.id))
  }

  permits(commandId: string): boolean {
    return this.resolve().some((command) => command.id === commandId)
  }

  isReachable(): boolean {
    return this.registry.isReachable()
  }
}
