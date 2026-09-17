import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { SessionRepository } from '../../session/session-repository'
import { Outcomes } from '../../shared/models/outcome'
import { ChatMessage, ChatProvider } from '../../model/providers/types'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { FakeVault } from '../../test-support/fake-vault'
import { aSession, aTextTurn, aToolCall, aToolTurn, anEngine } from '../../test-support/builders'

const TARGET = 'shopping-list.md'
const SAVED = '- milk'
const OTHER = 'todo.md'
const OTHER_CONTENT = '# Todo'

// The message the model reads the note from. It states a path and then the
// content under it, so a tab that moved mid-turn showed another note's content
// labelled as the target, and the model answered about the wrong note.
describe('EditEngine', () => {
  let editor: FakeEditor
  let sessions: SessionRepository
  let vault: FakeVault
  let noteLocator: FakeNoteLocator
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>

  beforeEach(() => {
    vi.clearAllMocks()
    editor = new FakeEditor(SAVED)
    sessions = aSession(TARGET)
    vault = new FakeVault().withNote(TARGET, SAVED).withNote(OTHER, OTHER_CONTENT)
    noteLocator = new FakeNoteLocator().withOpenNote(TARGET, editor)
    complete = vi.fn()
  })

  const engineOf = () =>
    anEngine(
      { complete },
      {
        sessions,
        noteLocator,
        vault,
        agentsMdRepository: new AgentsMdRepository(new FakeAdapter().asAdapter()),
      },
    )

  // The last message of a call is the note context, per ModelRequestParts.
  const noteContextOfCall = (call: number): string => {
    const messages = complete.mock.calls[call][0] as ChatMessage[]
    return messages[messages.length - 1].content
  }

  describe('when the tab still shows the target', () => {
    it('shows the model what the editor holds, unsaved text and all', async () => {
      editor.content = '- milk, unsaved'
      complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))

      await engineOf().processUtterance('what is on the list')

      expect(noteContextOfCall(0)).toContain('- milk, unsaved')
    })
  })

  // The reported defect. The handle the turn holds comes to show another note,
  // and every re-read through it answered with that note instead.
  describe('when the tab moves to another note mid-turn', () => {
    // The user switches tabs while the first call is in flight, so the second
    // call re-reads through a handle that now shows the other note. The first
    // step calls a tool so there is a second call to read it on.
    const switchesTabsAfterTheFirstCall = () => {
      complete
        .mockImplementationOnce(() => {
          editor.content = OTHER_CONTENT
          noteLocator.closeNote(TARGET).withOpenNote(OTHER, editor)
          return Promise.resolve(
            Outcomes.success(aToolTurn(aToolCall('resolve_date', { phrase: 'today' }))),
          )
        })
        .mockResolvedValue(Outcomes.success(aTextTurn('done')))
    }

    it('shows the model the target, from the file the tab left behind', async () => {
      switchesTabsAfterTheFirstCall()

      await engineOf().processUtterance('what is on the list')

      expect(noteContextOfCall(1)).toContain(SAVED)
    })

    it('never shows the model the content of the note the tab moved to', async () => {
      switchesTabsAfterTheFirstCall()

      await engineOf().processUtterance('what is on the list')

      expect(noteContextOfCall(1)).not.toContain(OTHER_CONTENT)
    })

    it('keeps the target path on the message, so the content still names it', async () => {
      switchesTabsAfterTheFirstCall()

      await engineOf().processUtterance('what is on the list')

      expect(noteContextOfCall(1)).toContain(`Note path: ${TARGET}`)
    })
  })
})
