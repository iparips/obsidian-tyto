import { App, Command } from 'obsidian'
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

// One read of Obsidian's command registry, so the catalogue and the picker ask
// the same source rather than each reaching for the private API.
export class CommandRegistry {
  constructor(private app: App) {}

  list(): readonly AllowedCommand[] {
    if (!this.isReachable()) return []
    return this.app.commands
      .listCommands()
      .filter((command) => CommandRegistry.isAvailable(command))
      .map((command) => new AllowedCommand(command.id, command.name))
  }

  executeCommandById(id: string): boolean {
    return this.app.commands.executeCommandById(id)
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
