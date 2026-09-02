import { App, Command } from 'obsidian'
import { AllowList } from './allow-list'
import { AllowedCommand } from './models/allowed-command'

// The registry holding the commands is not on the typed App class, though the
// Command interface is. Declared here and nowhere else.
declare module 'obsidian' {
  interface App {
    commands: {
      listCommands(): Command[]
      executeCommandById(id: string): boolean
    }
  }
}

// Resolves the user's entries against the live command list every call, so a
// command registered after the pattern was written is matched without a
// settings edit (FR6).
export class CommandCatalogue {
  constructor(
    private app: App,
    private allowList: AllowList,
  ) {}

  resolve(): readonly AllowedCommand[] {
    if (!this.isReachable()) return []
    return this.app.commands
      .listCommands()
      .filter((command) => this.allowList.permits(command.id))
      .filter((command) => CommandCatalogue.isAvailable(command))
      .map((command) => new AllowedCommand(command.id, command.name))
  }

  permits(commandId: string): boolean {
    return this.resolve().some((command) => command.id === commandId)
  }

  // An absent registry costs the command flow rather than the plugin, since
  // the methods are outside Obsidian's compatibility promise (NFR4).
  isReachable(): boolean {
    const registry = this.app.commands
    return (
      typeof registry?.listCommands === 'function' &&
      typeof registry?.executeCommandById === 'function'
    )
  }

  private static isAvailable(command: Command): boolean {
    return command.checkCallback ? command.checkCallback(true) !== false : true
  }
}
