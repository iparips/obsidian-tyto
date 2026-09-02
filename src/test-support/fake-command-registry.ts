import { App, Command } from 'obsidian'

// Stands in for app.commands, the registry Obsidian does not type. Supports
// being constructed without its methods, so the probe path has something to
// test against.
export class FakeCommandRegistry {
  readonly executed: string[] = []
  private readonly commands: Command[] = []
  private missing = false

  asApp(): App {
    return { commands: this.registry() } as unknown as App
  }

  withCommand(id: string, name: string): this {
    this.commands.push({ id, name })
    return this
  }

  withUnavailableCommand(id: string, name: string): this {
    this.commands.push({ id, name, checkCallback: () => false })
    return this
  }

  withoutRegistryMethods(): this {
    this.missing = true
    return this
  }

  listCommands(): Command[] {
    return [...this.commands]
  }

  executeCommandById(id: string): boolean {
    this.executed.push(id)
    return this.commands.some((command) => command.id === id)
  }

  private registry(): Record<string, unknown> {
    if (this.missing) return {}
    return {
      listCommands: () => this.listCommands(),
      executeCommandById: (id: string) => this.executeCommandById(id),
    }
  }
}
