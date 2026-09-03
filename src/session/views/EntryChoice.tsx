// Panel controls rather than a modal, so a session in the mobile drawer is not
// blocked by a dialog the drawer cannot show (NFR5). One row per candidate and
// a decline beneath them: choosing a note and allowing the write are one act.
export const EntryChoice = ({
  candidates,
  onChoose,
}: {
  candidates: readonly string[]
  onChoose(chosen: string | null): void
}) => (
  <div className="owl-entry-choice" aria-label="Choose the note">
    {candidates.map((path) => (
      <button key={path} aria-label={`Choose ${path}`} onClick={() => onChoose(path)}>
        {path}
      </button>
    ))}
    <button
      className="owl-entry-choice-decline"
      aria-label="Decline every note"
      onClick={() => onChoose(null)}
    >
      None of these
    </button>
  </div>
)
