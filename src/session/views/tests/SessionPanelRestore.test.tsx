import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionPanel, RecorderPort, SessionPanelProps } from '../SessionPanel'
import { Utterance } from '../../../recorder'
import { Attempt, Outcome, Outcomes } from '../../../shared/models/outcome'

describe('SessionPanel', () => {
  let recorder: RecorderPort
  let transcribe: Mock<[Blob, string], Promise<Attempt<string>>>
  let processUtterance: Mock<[string], Promise<Outcome<string>>>

  beforeEach(() => {
    vi.clearAllMocks()
    recorder = {
      start: vi.fn().mockResolvedValue(Outcomes.success(undefined)),
      stop: vi.fn().mockResolvedValue(new Utterance(new Blob(['a']), 'audio/webm')),
      cancel: vi.fn(),
    }
    transcribe = vi.fn().mockResolvedValue(Outcomes.success('spoken words'))
    processUtterance = vi.fn().mockResolvedValue(Outcomes.success('made the edit'))
  })

  const renderPanel = (overrides: Partial<SessionPanelProps> = {}) =>
    render(
      <SessionPanel
        noteName="note"
        recorder={recorder}
        transcribe={transcribe}
        processUtterance={processUtterance}
        onHidden={() => () => undefined}
        {...overrides}
      />,
    )

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
})
