import { AnswerSources, SourceNote } from './answer-sources'
import { OpenSourceNoteFn } from './open-source-note'

// Collapsed by default, like the turn's steps: the answer is what the user
// reads, and which notes it drew on is a check they open when they want to
// follow one up. Twelve archived notes otherwise put a wall of repeated folder
// between the answer and whatever came after it.
//
// Rendered apart from the copyable body, so copying yields the answer alone
// (FR28), and the count stays in the summary so a collapsed block still says
// how much the answer rests on.
export const EntrySources = ({
  sources,
  onOpenSource,
}: {
  sources: string[]
  onOpenSource?: OpenSourceNoteFn
}) =>
  sources.length === 0 ? (
    <div className="tyto-entry-sources" aria-label="Answer sources">
      No notes matched
    </div>
  ) : (
    <details className="tyto-entry-sources">
      <summary aria-label="Answer sources">
        From {sources.length} {sources.length === 1 ? 'note' : 'notes'}
      </summary>
      <div aria-label="The notes the answer drew on">
        {AnswerSources.grouped(sources).map((group) => (
          <div className="tyto-entry-sources-group" key={group.folder}>
            <span className="tyto-entry-sources-folder">{group.folder}</span>
            <span className="tyto-entry-sources-names">
              {group.notes.map((note, index) => (
                <span key={note.path}>
                  {index > 0 && ', '}
                  <SourceName note={note} onOpenSource={onOpenSource} />
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </details>
  )

// A link only where something can open it. Without the port there is no vault
// to open into, so the name is the text it already was rather than a control
// that does nothing when clicked.
const SourceName = ({
  note,
  onOpenSource,
}: {
  note: SourceNote
  onOpenSource?: OpenSourceNoteFn
}) =>
  onOpenSource ? (
    <a
      className="tyto-entry-sources-link"
      href="#"
      onClick={(event) => {
        event.preventDefault()
        onOpenSource(note.path)
      }}
    >
      {note.name}
    </a>
  ) : (
    <>{note.name}</>
  )
