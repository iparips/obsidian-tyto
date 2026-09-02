import { AllowedCommand } from '../commands/models/allowed-command'

// Collapsed to a count, because a namespace pattern can resolve to dozens of
// commands and the plugin targets phones (FR7, FR8).
export const ResolvedCommands = ({ commands }: { commands: readonly AllowedCommand[] }) => (
  <details className="owl-resolved-commands">
    <summary>{`${commands.length} commands allowed right now`}</summary>
    <ul aria-label="Resolved commands">
      {commands.map((command) => (
        <li key={command.id}>{`${command.name} (${command.id})`}</li>
      ))}
    </ul>
  </details>
)
