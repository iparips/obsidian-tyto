// Rendered apart from the copyable body, so the user sees at a glance how many
// notes an answer drew on and copying yields the answer alone (FR28).
export const EntrySources = ({ sources }: { sources: string[] }) => (
  <div className="owl-entry-sources" aria-label="Answer sources">
    {sources.length === 0 ? 'No notes matched' : `From ${sources.length}: ${sources.join(', ')}`}
  </div>
)
