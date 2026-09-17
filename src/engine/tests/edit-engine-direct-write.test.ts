import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { SessionRepository } from '../../session/session-repository'
import { Outcomes } from '../../shared/models/outcome'
import { ChatProvider } from '../../model/providers/types'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { FakeVault } from '../../test-support/fake-vault'
import { ProgressLine } from '../progress-line'
import { aSession, aTextTurn, aToolCall, aToolTurn, anEngine } from '../../test-support/builders'

const TARGET = 'shopping-list.md'
const SAVED = '- milk'
const OTHER = 'todo.md'

// A write that falls back to the vault costs the cursor, and may cost undo. The
// panel said nothing about it, so a user whose editor could not take the edit
// back was never told. The edit line itself now carries it, where a warning
// below the list named neither the edit nor the note.
describe('EditEngine', () => {
  let editor: FakeEditor
  let sessions: SessionRepository
  let vault: FakeVault
  let noteLocator: FakeNoteLocator
  let warnings: string[]
  let steps: ProgressLine[]
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>

  beforeEach(() => {
    vi.clearAllMocks()
    editor = new FakeEditor(SAVED)
    sessions = aSession(TARGET)
    vault = new FakeVault().withNote(TARGET, SAVED).withNote(OTHER, '# Todo')
    noteLocator = new FakeNoteLocator().withOpenNote(TARGET, editor)
    warnings = []
    steps = []
    complete = vi.fn()
  })

  const engineOf = () =>
    anEngine(
      { complete },
      {
        sessions,
        noteLocator,
        vault,
        agentsMdRepository: new AgentsMdRepository(new FakeVault().asVault()),
        progress: new TurnProgressPublisher(
          () => undefined,
          () => undefined,
          () => undefined,
          () => undefined,
          (text) => warnings.push(text),
          (step) => steps.push(step),
        ),
      },
    )

  const addsItem = () =>
    aToolTurn(
      aToolCall('insert_text', {
        anchor_text: '- milk',
        position: 'after',
        content: '\n- eggs',
      }),
    )

  const editsTheTarget = () => {
    complete.mockResolvedValueOnce(Outcomes.success(addsItem()))
    complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))
  }

  // The user switches tabs while the first call is in flight, so the handle the
  // turn holds comes to show the other note and the write goes to the file.
  const switchesTabsBeforeTheEdit = () => {
    complete
      .mockImplementationOnce(() => {
        noteLocator.closeNote(TARGET).withOpenNote(OTHER, editor)
        return Promise.resolve(Outcomes.success(addsItem()))
      })
      .mockResolvedValue(Outcomes.success(aTextTurn('done')))
  }

  const editLine = (): ProgressLine | undefined => steps.find((step) => step.label === 'Edit')

  describe('when an edit goes through the editor', () => {
    it('publishes the edit line naming the note', async () => {
      editsTheTarget()

      await engineOf().processUtterance('add eggs')

      expect(editLine()?.note).toBe(TARGET)
    })

    it('leaves the line unmarked, since the editor can take the edit back', async () => {
      editsTheTarget()

      await engineOf().processUtterance('add eggs')

      expect(editLine()?.wroteDirect).toBe(false)
    })
  })

  describe('when an edit falls back to the vault', () => {
    it('publishes the edit line naming the note, as the editor path does', async () => {
      switchesTabsBeforeTheEdit()

      await engineOf().processUtterance('add eggs')

      expect(editLine()?.note).toBe(TARGET)
    })

    it('marks the line as written straight to the file', async () => {
      switchesTabsBeforeTheEdit()

      await engineOf().processUtterance('add eggs')

      expect(editLine()?.wroteDirect).toBe(true)
    })

    // The step budget owns that channel; an edit says what it did on its own
    // line, where a warning below the list named neither edit nor note.
    it('publishes no warning beside the list', async () => {
      switchesTabsBeforeTheEdit()

      await engineOf().processUtterance('add eggs')

      expect(warnings).toEqual([])
    })
  })

  describe('when an edit applies nothing', () => {
    // No write happened, so there is no path to report.
    it('publishes a refusal and no warning', async () => {
      complete.mockResolvedValueOnce(
        Outcomes.success(
          aToolTurn(
            aToolCall('insert_text', {
              anchor_text: '- nothing matches this',
              position: 'after',
              content: '\n- eggs',
            }),
          ),
        ),
      )
      complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))

      await engineOf().processUtterance('add eggs')

      expect(warnings).toEqual([])
      expect(steps.at(-1)?.label).toBe('Refused insert_text')
    })
  })
})
