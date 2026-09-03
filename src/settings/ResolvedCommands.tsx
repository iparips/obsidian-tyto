import { AllowedCommand } from '../commands/models/allowed-command'

// Collapsed by default: the entries are the setting, and what they resolve to
// is a check the user opens when they want it (FR10, FR11).
export const ResolvedCommands = ({ commands }: { commands: readonly AllowedCommand[] }) => (
  <details className="owl-resolved-commands">
    <summary>{`Reaches ${commands.length} ${commands.length === 1 ? 'command' : 'commands'}`}</summary>
    <ul aria-label="Resolved commands">
      {commands.map((command) => (
        <li key={command.id}>
          <span className="owl-resolved-name">{command.name}</span>
          <code className="owl-resolved-id">{command.id}</code>
        </li>
      ))}
    </ul>
  </details>
)
