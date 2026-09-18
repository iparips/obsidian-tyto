import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionPanel, RecorderPort, SessionPanelProps } from '../SessionPanel'
import { Attempt, Outcomes } from '../../../shared/models/outcome'
import { DEFAULT_SETTINGS } from '../../../settings/settings'
import { TurnResult } from '../../../engine/turn/ending/turn-result'
import { aTurnResult } from '../../../test-support/builders'
import { TranscriptSource } from '../../transcript/models/transcript-source'

// The panel supplies what the user saw and the builder supplies what the model
// was sent, so this is the one case that holds the two halves together.
describe('SessionPanel transcript copy', () => {
  let recorder: RecorderPort
  let transcribe: Mock<[Blob, string], Promise<Attempt<string>>>
  let processUtterance: Mock<[string], Promise<TurnResult>>
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    recorder = {
      start: vi.fn(),
      stop: vi.fn(),
      cancel: vi.fn(),
      stream: vi.fn().mockReturnValue(null),
    }
    transcribe = vi.fn()
    processUtterance = vi.fn().mockResolvedValue(aTurnResult(Outcomes.success('made the edit')))
    writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  })

  const renderPanel = (overrides: Partial<SessionPanelProps> = {}) =>
    render(
      <SessionPanel
        noteName="note"
        recorder={recorder}
        transcribe={transcribe}
        processUtterance={processUtterance}
        onObsidianBackgrounded={() => () => undefined}
        transcriptOf={(entries) =>
          new TranscriptSource(
            { copiedAt: new Date(2026, 8, 10, 15, 25), pluginVersion: '0.1.0', notePath: 'a.md' },
            DEFAULT_SETTINGS,
            entries,
            [],
            [],
            [],
            [],
          )
        }
        {...overrides}
      />,
    )

  const sayIt = async () => {
    await userEvent.type(screen.getByRole('textbox'), 'rename it')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(screen.getByText('made the edit')).toBeTruthy())
  }

  it('offers no Copy button while the setting is off', async () => {
    renderPanel({ settings: DEFAULT_SETTINGS })

    await sayIt()

    expect(screen.queryByRole('button', { name: 'Copy transcript' })).toBeNull()
  })

  it('copies the session the panel is showing when the setting is on', async () => {
    renderPanel({ settings: { ...DEFAULT_SETTINGS, transcriptCopyEnabled: true } })
    await sayIt()

    await userEvent.click(screen.getByRole('button', { name: 'Copy transcript' }))

    expect(writeText).toHaveBeenCalledTimes(1)
    const copied = writeText.mock.calls[0][0] as string
    expect(copied).toContain('# Tyto session transcript')
    expect(copied).toContain('Utterance: rename it')
    expect(copied).toContain('Reply: made the edit')
  })

  it('offers nothing to copy before the first entry lands', () => {
    renderPanel({ settings: { ...DEFAULT_SETTINGS, transcriptCopyEnabled: true } })

    expect(screen.getByRole('button', { name: 'Copy transcript' }).hasAttribute('disabled')).toBe(
      true,
    )
  })
})
