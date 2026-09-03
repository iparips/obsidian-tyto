// Buttons that fill the input rather than sending on their own, so the user can
// edit a suggestion before it becomes their answer (FR19).
export const EntrySuggestions = ({
  suggestions,
  onPick,
}: {
  suggestions: string[]
  onPick(suggestion: string): void
}) => (
  <div className="owl-entry-suggestions" aria-label="Suggested answers">
    {suggestions.map((suggestion) => (
      <button key={suggestion} onClick={() => onPick(suggestion)}>
        {suggestion}
      </button>
    ))}
  </div>
)
