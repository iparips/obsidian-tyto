import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionPanel, RecorderPort, SessionPanelProps } from '../SessionPanel'
import { Utterance } from '../../../capture/recorder'
import { Outcome, Outcomes } from '../../../shared/models/outcome'

describe('SessionPanel', () => {
  let recorder: RecorderPort
  let transcribe: Mock<[Blob, string], Promise<Outcome<string>>>
  let processUtterance: Mock<[string], Promise<Outcome<string>>>
  let notify: Mock<[string], void>

  beforeEach(() => {
    vi.clearAllMocks()
    recorder = {
      start: vi.fn().mockResolvedValue(Outcomes.success(undefined)),
      stop: vi.fn().mockResolvedValue(new Utterance(new Blob(['a']), 'audio/webm')),
      cancel: vi.fn(),
    }
    transcribe = vi.fn().mockResolvedValue(Outcomes.success('spoken words'))
    processUtterance = vi.fn().mockResolvedValue(Outcomes.success('made the edit'))
    notify = vi.fn()
  })

  const hiddenListeners: (() => void)[] = []
  const onHidden = (listener: () => void) => {
    hiddenListeners.push(listener)
    return () => hiddenListeners.splice(hiddenListeners.indexOf(listener), 1)
  }
  const goToBackground = () => act(() => hiddenListeners.forEach((listener) => listener()))

  const renderPanel = (overrides: Partial<SessionPanelProps> = {}) =>
    render(
      <SessionPanel
        noteName="note"
        recorder={recorder}
        transcribe={transcribe}
        processUtterance={processUtterance}
        onHidden={onHidden}
        notify={notify}
        {...overrides}
      />,
    )

  describe('when using the mic', () => {
    it('transitions to recording when the mic button is clicked in idle', async () => {
      renderPanel()

      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      expect(screen.getByRole('button', { name: 'Stop recording' })).toBeTruthy()
    })

    it('transitions to transcribing when the mic is clicked while recording', async () => {
      let resolveTranscribe: (value: Outcome<string>) => void = () => undefined
      transcribe.mockReturnValue(
        new Promise<Outcome<string>>((resolve) => (resolveTranscribe = resolve)),
      )
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await userEvent.click(screen.getByRole('button', { name: 'Stop recording' }))

      expect(screen.getByRole('button', { name: 'Record' }).hasAttribute('disabled')).toBe(true)
      resolveTranscribe(Outcomes.success('spoken words'))
      await waitFor(() => expect(screen.getByText('made the edit')).toBeTruthy())
    })

    it('returns to idle when cancel is clicked while recording', async () => {
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(recorder.cancel).toHaveBeenCalled()
      expect(screen.getByRole('button', { name: 'Record' }).hasAttribute('disabled')).toBe(false)
    })

    it('renders a user entry when the transcript arrives', async () => {
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await userEvent.click(screen.getByRole('button', { name: 'Stop recording' }))

      await waitFor(() => expect(screen.getByText('spoken words')).toBeTruthy())
    })

    it('renders an assistant entry when the turn summary arrives', async () => {
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await userEvent.click(screen.getByRole('button', { name: 'Stop recording' }))

      await waitFor(() => expect(screen.getByText('made the edit')).toBeTruthy())
    })

    it('renders an error entry naming the step when an outcome fails', async () => {
      processUtterance.mockResolvedValue(Outcomes.failure('chat', 'model unavailable'))
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await userEvent.click(screen.getByRole('button', { name: 'Stop recording' }))

      await waitFor(() => expect(screen.getByText('chat failed: model unavailable')).toBeTruthy())
    })
  })

  describe('when starting a new session', () => {
    it('calls startNewSession when the button is clicked in idle', async () => {
      const startNewSession = vi.fn()
      renderPanel({ startNewSession })

      await userEvent.click(screen.getByRole('button', { name: 'Reset session' }))

      expect(startNewSession).toHaveBeenCalled()
    })

    it('omits the button when no startNewSession is given', () => {
      renderPanel()

      expect(screen.queryByRole('button', { name: 'Reset session' })).toBeNull()
    })

    it('disables the button while recording', async () => {
      renderPanel({ startNewSession: vi.fn() })
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      const button = screen.getByRole('button', { name: 'Reset session' })

      expect(button.hasAttribute('disabled')).toBe(true)
    })
  })

  describe('when the document becomes hidden', () => {
    it('discards the recording and returns to idle when hidden while recording', async () => {
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      goToBackground()

      expect(recorder.cancel).toHaveBeenCalled()
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Record' }).hasAttribute('disabled')).toBe(false),
      )
    })

    it('notifies that the recording was discarded when hidden while recording', async () => {
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      goToBackground()

      expect(notify).toHaveBeenCalledWith(
        'Recording discarded: Owl cannot record in the background.',
      )
    })

    it('leaves the recorder alone when hidden while idle', () => {
      renderPanel()

      goToBackground()

      expect(recorder.cancel).not.toHaveBeenCalled()
    })
  })

  describe('when typing', () => {
    it('disables the send button while a turn is thinking', async () => {
      let resolveTurn: (value: Outcome<string>) => void = () => undefined
      processUtterance.mockReturnValue(
        new Promise<Outcome<string>>((resolve) => (resolveTurn = resolve)),
      )
      renderPanel()
      await userEvent.type(screen.getByRole('textbox', { name: 'Instruction' }), 'do it')

      await userEvent.click(screen.getByRole('button', { name: 'Send' }))

      expect(screen.getByRole('button', { name: 'Send' }).hasAttribute('disabled')).toBe(true)
      resolveTurn(Outcomes.success('ok'))
      await waitFor(() => expect(screen.getByText('ok')).toBeTruthy())
    })

    it('submits typed text when send is clicked in idle', async () => {
      renderPanel()
      await userEvent.type(screen.getByRole('textbox', { name: 'Instruction' }), 'rename heading')

      await userEvent.click(screen.getByRole('button', { name: 'Send' }))

      await waitFor(() => expect(processUtterance).toHaveBeenCalledWith('rename heading'))
    })
  })

  describe('when a turn resolves instruction files', () => {
    const instructionListeners: ((text: string) => void)[] = []
    const onInstructions = (listener: (text: string) => void) => {
      instructionListeners.push(listener)
      return () => instructionListeners.splice(instructionListeners.indexOf(listener), 1)
    }
    const report = (text: string) =>
      act(() => instructionListeners.forEach((listener) => listener(text)))

    it('lists the folders that applied when a chain is reported', () => {
      renderPanel({ onInstructions })

      report('Instructions applied: vault root, Journal')

      expect(screen.getByText('Instructions applied: vault root, Journal')).toBeTruthy()
    })

    it('shows the drop count when the cap dropped a file', () => {
      renderPanel({ onInstructions })

      report('Instructions applied: Journal (1 dropped over the size limit)')

      expect(screen.getByText(/1 dropped over the size limit/)).toBeTruthy()
    })
  })

  describe('when a command moves the target note', () => {
    const targetListeners: ((path: string) => void)[] = []
    const onTargetNoteChanged = (listener: (path: string) => void) => {
      targetListeners.push(listener)
      return () => targetListeners.splice(targetListeners.indexOf(listener), 1)
    }
    const retargetTo = (path: string) =>
      act(() => targetListeners.forEach((listener) => listener(path)))

    beforeEach(() => {
      targetListeners.length = 0
    })

    it('names the new target note in the header when a change is reported', () => {
      renderPanel({ onTargetNoteChanged })

      retargetTo('Journal/2026-09-02.md')

      expect(screen.getByText('2026-09-02')).toBeTruthy()
    })

    it('offers a way back to the starting note when a change is reported', () => {
      renderPanel({ onTargetNoteChanged, returnToStartingNote: vi.fn() })

      retargetTo('Journal/2026-09-02.md')

      expect(screen.getByRole('button', { name: 'Return to note' })).toBeTruthy()
    })

    it('hides the way back when the session is still on its starting note', () => {
      renderPanel({ onTargetNoteChanged, returnToStartingNote: vi.fn() })

      expect(screen.queryByRole('button', { name: 'Return to note' })).toBeNull()
    })

    it('returns the target note when the way back is clicked', async () => {
      const returnToStartingNote = vi.fn()
      renderPanel({ onTargetNoteChanged, returnToStartingNote })
      retargetTo('Journal/2026-09-02.md')

      await userEvent.click(screen.getByRole('button', { name: 'Return to note' }))

      expect(returnToStartingNote).toHaveBeenCalled()
    })
  })

  describe('when a turn runs a command or answers', () => {
    const commandListeners: ((text: string) => void)[] = []
    const answerListeners: ((report: { text: string; sources: string[] }) => void)[] = []
    const onCommandRun = (listener: (text: string) => void) => {
      commandListeners.push(listener)
      return () => commandListeners.splice(commandListeners.indexOf(listener), 1)
    }
    const onAnswer = (listener: (report: { text: string; sources: string[] }) => void) => {
      answerListeners.push(listener)
      return () => answerListeners.splice(answerListeners.indexOf(listener), 1)
    }

    beforeEach(() => {
      commandListeners.length = 0
      answerListeners.length = 0
    })

    it('renders a command entry when a command run is reported', () => {
      renderPanel({ onCommandRun })

      act(() => commandListeners.forEach((listener) => listener('ran Open today')))

      expect(screen.getByText('ran Open today')).toBeTruthy()
    })

    it('renders an answer with its sources when an answer is reported', () => {
      renderPanel({ onAnswer })

      act(() =>
        answerListeners.forEach((listener) =>
          listener({ text: 'It was 12k.', sources: ['Quotes/roofing.md'] }),
        ),
      )

      expect(screen.getByLabelText('Answer sources').textContent).toBe('From 1: Quotes/roofing.md')
    })
  })
})
