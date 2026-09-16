import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChoiceRequest, SessionPanel, RecorderPort, SessionPanelProps } from '../SessionPanel'
import { Utterance } from '../../../recorder'
import { Attempt, Outcome, Outcomes } from '../../../shared/models/outcome'
import { PanelEntry } from '../../models/panel-state'

describe('SessionPanel', () => {
  let recorder: RecorderPort
  let transcribe: Mock<[Blob, string], Promise<Attempt<string>>>
  let processUtterance: Mock<[string], Promise<Outcome<string>>>
  let recordHistory: Mock<[readonly PanelEntry[]], void>

  beforeEach(() => {
    vi.clearAllMocks()
    recorder = {
      start: vi.fn().mockResolvedValue(Outcomes.success(undefined)),
      stop: vi.fn().mockResolvedValue(new Utterance(new Blob(['a']), 'audio/webm')),
      cancel: vi.fn(),
      stream: vi.fn().mockReturnValue(null),
    }
    transcribe = vi.fn().mockResolvedValue(Outcomes.success('spoken words'))
    processUtterance = vi.fn().mockResolvedValue(Outcomes.success('made the edit'))
    recordHistory = vi.fn()
  })

  const renderPanel = (overrides: Partial<SessionPanelProps> = {}) =>
    render(
      <SessionPanel
        noteName="note"
        recorder={recorder}
        transcribe={transcribe}
        processUtterance={processUtterance}
        onObsidianBackgrounded={() => () => undefined}
        recordHistory={recordHistory}
        {...overrides}
      />,
    )

  const runTurn = async () => {
    await userEvent.type(screen.getByRole('textbox'), 'add a heading')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
  }

  // What the recorder was last handed, which is what would be on disk.
  const lastRecorded = () => recordHistory.mock.lastCall?.[0]

  describe('when a turn is running', () => {
    it('records the utterance before the model is called, so an eviction keeps it', async () => {
      let settle: (outcome: Outcome<string>) => void = () => undefined
      processUtterance.mockReturnValue(new Promise((resolve) => (settle = resolve)))
      renderPanel()

      await runTurn()

      expect(lastRecorded()).toEqual([{ kind: 'user', text: 'add a heading' }])
      await act(async () => settle(Outcomes.success('made the edit')))
    })
  })

  describe('when a turn ends', () => {
    it('records the history as it now stands rather than the newest entry', async () => {
      renderPanel()

      await runTurn()

      await waitFor(() =>
        expect(lastRecorded()).toEqual([
          { kind: 'user', text: 'add a heading' },
          { kind: 'assistant', text: 'made the edit' },
        ]),
      )
    })

    it('records the error when the turn failed', async () => {
      processUtterance.mockResolvedValue(Outcomes.failure('chat', 'the provider failed'))
      renderPanel()

      await runTurn()

      await waitFor(() =>
        expect(lastRecorded()).toEqual([
          { kind: 'user', text: 'add a heading' },
          { kind: 'error', step: 'chat', text: 'the provider failed' },
        ]),
      )
    })

    it('records the cancellation when the user stopped the turn', async () => {
      processUtterance.mockResolvedValue(Outcomes.cancelled('chat', []))
      renderPanel()

      await runTurn()

      await waitFor(() =>
        expect(lastRecorded()).toEqual([
          { kind: 'user', text: 'add a heading' },
          { kind: 'cancelled', text: 'Stopped. Nothing was changed.' },
        ]),
      )
    })

    it('records an entry a later action rewrote in its new form', async () => {
      renderPanel({
        entries: [{ kind: 'choice', candidates: ['a.md'], pending: true, text: 'which note' }],
      })

      await runTurn()

      await waitFor(() =>
        expect(lastRecorded()?.[0]).toEqual({
          kind: 'choice',
          candidates: ['a.md'],
          pending: false,
          text: 'The turn ended before you picked a note',
        }),
      )
    })
  })

  describe('when the panel is closed mid-turn', () => {
    it('records the turn that ended after the unmount, which no effect could', async () => {
      let settle: (outcome: Outcome<string>) => void = () => undefined
      processUtterance.mockReturnValue(new Promise((resolve) => (settle = resolve)))
      const view = renderPanel()
      await runTurn()

      view.unmount()
      settle(Outcomes.success('made the edit'))

      await waitFor(() =>
        expect(lastRecorded()).toEqual([
          { kind: 'user', text: 'add a heading' },
          { kind: 'assistant', text: 'made the edit' },
        ]),
      )
    })
  })

  // Cancelling a pending choice settles it and requests the cancel in the same
  // tick, which is the one place two dispatches land before a render.
  describe('when two actions are dispatched in one tick', () => {
    it('records what the second action left rather than the first twice', async () => {
      let askPanel: (request: ChoiceRequest) => Promise<string | null> = () => Promise.resolve(null)
      processUtterance.mockReturnValue(new Promise(() => undefined))
      renderPanel({
        onChoiceRequested: (listener) => {
          askPanel = listener
          return () => undefined
        },
      })
      await runTurn()
      act(() => void askPanel({ candidates: ['a.md'], purpose: 'which note' }))

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(lastRecorded()).toEqual([
        { kind: 'user', text: 'add a heading' },
        {
          kind: 'choice',
          candidates: ['a.md'],
          pending: false,
          text: 'Declined every note offered',
        },
      ])
    })
  })

  describe('when the app is evicted mid-turn', () => {
    // What eviction leaves behind is whatever was last recorded, so the record
    // taken mid-turn is what the next session opens on.
    const evictedMidTurn = async (): Promise<readonly PanelEntry[]> => {
      processUtterance.mockReturnValue(new Promise(() => undefined))
      const view = renderPanel()
      await runTurn()
      view.unmount()
      return lastRecorded() ?? []
    }

    it('restores the utterance from the record taken before the turn ended', async () => {
      const evicted = await evictedMidTurn()

      renderPanel({ entries: [...evicted] })

      expect(screen.getByText('add a heading')).toBeTruthy()
    })

    it('opens idle rather than mid-turn, since the turn went with the WebView', async () => {
      const evicted = await evictedMidTurn()

      renderPanel({ entries: [...evicted] })

      expect(screen.getByRole('button', { name: 'Record' })).toBeTruthy()
    })
  })
})
