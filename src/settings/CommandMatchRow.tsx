import { CommandMatch } from '../commands/models/command-match'

export interface CommandMatchRowProps {
  match: CommandMatch
  onAdd(commandId: string): void
}

// The row is the control: a whole row is a bigger tap target than a button in
// it, and one action per result needs no second thing to aim at (FR5, FR14).
export const CommandMatchRow = ({ match, onAdd }: CommandMatchRowProps) => (
  <li className="owl-command-match">
    <button
      type="button"
      className="owl-command-match-choice"
      disabled={match.isCovered()}
      onClick={() => onAdd(match.command.id)}
    >
      <span className="owl-command-match-name">{match.command.name}</span>
      <code className="owl-command-match-id">{match.command.id}</code>
      {match.isCovered() && (
        <span className="owl-command-match-covered">{`Allowed by ${match.coveredBy}`}</span>
      )}
    </button>
  </li>
)
