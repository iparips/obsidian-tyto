import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionPanel, RecorderPort, SessionPanelProps } from '../SessionPanel'
import { Utterance } from '../../../recorder'
import { Attempt, Outcome, Outcomes } from '../../../shared/models/outcome'
import { PanelEntry } from '../../models/panel-state'
import { TurnEndingKind } from '../../../engine/turn/ending/turn-ending-kind'

describe('SessionPanel', () => {
  let recorder: RecorderPort
  let transcribe: Mock<[Blob, string], Promise<Attempt<string>>>
  let processUtterance: Mock<[string], Promise<Outcome<string>>>
  let onTurnEnded: Mock<[TurnEndingKind, readonly PanelEntry[]], void>

  beforeEach(() => {
    vi.clearAllMocks()
    recorder = {
      start: vi.fn().mockResolvedValue(Outcomes.success(undefined)),
      stop: vi.fn().mockResolvedValue(new Utterance(new Blob(['a']), 'audio/webm')),
      cancel: vi.fn(),
    }
    transcribe = vi.fn().mockResolvedValue(Outcomes.success('spoken words'))
    processUtterance = vi.fn().mockResolvedValue(Outcomes.success('made the edit'))
    onTurnEnded = vi.fn()
  })

  const renderPanel = (overrides: Partial<SessionPanelProps> = {}) =>
    render(
      <SessionPanel
        noteName="note"
        recorder={recorder}
        transcribe={transcribe}
        processUtterance={processUtterance}
        onHidden={() => () => undefined}
        buildSnapshotFromEntries={(entries) => ({
          version: 1,
          targetPath: null,
          messages: [],
          entries: [...entries],
        })}
        {...overrides}
      />,
    )

  const runTurn = async () => {
    await userEvent.type(screen.getByRole('textbox'), 'add a heading')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
  }

  describe('when a session is restored', () => {
    it('renders the restored entries when a session is restored', () => {
      renderPanel({ entries: [{ kind: 'user', text: 'add a heading' }] })

      expect(screen.getByText('add a heading')).toBeTruthy()
    })

    it('renders no entries when a session is built rather than restored', () => {
      renderPanel()

      expect(screen.queryByText('add a heading')).toBeNull()
    })

    it('says the session was restored when a record came back', () => {
      renderPanel({
        entries: [
          { kind: 'user', text: 'add a heading' },
          { kind: 'restored', text: 'Session restored from 2026-09-11 14:32 AEST.' },
        ],
      })

      expect(screen.getByText('Session restored from 2026-09-11 14:32 AEST.')).toBeTruthy()
    })

    it('opens in the idle phase whatever phase was stored', () => {
      renderPanel({ entries: [{ kind: 'user', text: 'add a heading' }] })

      expect(screen.getByRole('button', { name: 'Record' })).toBeTruthy()
    })
  })

  describe('when a restored session held a pending question', () => {
    beforeEach(() => {
      renderPanel({
        entries: [{ kind: 'question', pending: true, suggestions: ['yes'], text: 'go ahead?' }],
      })
    })

    it('keeps the question text when the question was never answered', () => {
      expect(screen.getByText('go ahead?')).toBeTruthy()
    })

    it('drops the suggestions when the question was never answered', () => {
      expect(screen.queryByRole('button', { name: 'yes' })).toBeNull()
    })
  })

  describe('when a restored session held a pending choice', () => {
    beforeEach(() => {
      renderPanel({
        entries: [
          { kind: 'choice', candidates: ['a.md', 'b.md'], pending: true, text: 'which note' },
        ],
      })
    })

    it('says the turn ended when the choice was never made', () => {
      expect(screen.getByText('The turn ended before you picked a note')).toBeTruthy()
    })

    it('offers no rows when the choice was never made', () => {
      expect(screen.queryByRole('button', { name: 'a.md' })).toBeNull()
    })
  })

  describe('when a turn ends', () => {
    it('reports a finished turn as replied when the turn succeeded', async () => {
      renderPanel({ onTurnEnded })

      await runTurn()

      await waitFor(() =>
        expect(onTurnEnded).toHaveBeenCalledWith(TurnEndingKind.Replied, [
          { kind: 'user', text: 'add a heading' },
          { kind: 'assistant', text: 'made the edit' },
        ]),
      )
    })

    it('reports a failed turn as failed when the turn failed', async () => {
      processUtterance.mockResolvedValue(Outcomes.failure('chat', 'the provider failed'))
      renderPanel({ onTurnEnded })

      await runTurn()

      await waitFor(() =>
        expect(onTurnEnded).toHaveBeenCalledWith(TurnEndingKind.Failed, [
          { kind: 'user', text: 'add a heading' },
          { kind: 'error', step: 'chat', text: 'the provider failed' },
        ]),
      )
    })

    it('reports a cancelled turn as cancelled, which no callback carries today', async () => {
      processUtterance.mockResolvedValue(Outcomes.cancelled('chat', []))
      renderPanel({ onTurnEnded })

      await runTurn()

      await waitFor(() =>
        expect(onTurnEnded).toHaveBeenCalledWith(TurnEndingKind.Cancelled, [
          { kind: 'user', text: 'add a heading' },
          { kind: 'cancelled', text: 'Stopped. Nothing was changed.' },
        ]),
      )
    })

    it('reports the ending once when a turn ends', async () => {
      renderPanel({ onTurnEnded })

      await runTurn()

      await waitFor(() => expect(onTurnEnded).toHaveBeenCalledTimes(1))
    })
  })
})
