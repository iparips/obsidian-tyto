export interface PanelHeaderProps {
  // Null while the session is unbound, which the header says rather than naming
  // a note.
  name: string | null
  // The path from the vault root, beneath the name, so two notes sharing a name
  // are told apart (FR14).
  path: string | null
  running: boolean
  onReset?(): void
}

export const PanelHeader = ({ name, path, running, onReset }: PanelHeaderProps) => (
  <div className="owl-header">
    <div className="owl-header-target">
      <span className="owl-header-name">{name ?? NO_NOTE_BOUND}</span>
      {path && (
        <span className="owl-header-path" aria-label="Note path">
          {path}
        </span>
      )}
    </div>
    {onReset && (
      <button
        className="owl-new-session"
        aria-label="Reset session"
        disabled={running}
        onClick={onReset}
      >
        Reset
      </button>
    )}
  </div>
)

const NO_NOTE_BOUND = 'No note open'
