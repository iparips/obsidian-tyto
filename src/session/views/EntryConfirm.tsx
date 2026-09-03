// Panel controls rather than a modal, so a session in the mobile drawer is not
// blocked by a dialog the drawer cannot show (NFR5).
export const EntryConfirm = ({ onAnswer }: { onAnswer(granted: boolean): void }) => (
  <div className="owl-entry-confirm" aria-label="Approve the note">
    <button aria-label="Approve open" onClick={() => onAnswer(true)}>
      Open it
    </button>
    <button aria-label="Decline open" onClick={() => onAnswer(false)}>
      Don't
    </button>
  </div>
)
