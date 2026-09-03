import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionPanel, RecorderPort, SessionPanelProps } from '../SessionPanel'
import { Utterance } from '../../../capture/recorder'
import { Attempt, Outcome, Outcomes } from '../../../shared/models/outcome'

describe('SessionPanel', () => {
  let recorder: RecorderPort
  let transcribe: Mock<[Blob, string], Promise<Attempt<string>>>
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
      let resolveTranscribe: (value: Attempt<string>) => void = () => undefined
      transcribe.mockReturnValue(
        new Promise<Attempt<string>>((resolve) => (resolveTranscribe = resolve)),
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

    it('renders Cancel in place of Send while recording', async () => {
      renderPanel()

      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      expect(screen.queryByRole('button', { name: 'Send' })).toBeNull()
    })

    it('offers one cancel button while recording, since one covers both', async () => {
      renderPanel()

      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      expect(screen.getAllByRole('button', { name: 'Cancel' })).toHaveLength(1)
    })

    it('says nothing in the panel when a cancel discarded only a recording', async () => {
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByText(/Stopped/)).toBeNull()
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
    it('offers no send button while a turn is thinking', async () => {
      let resolveTurn: (value: Outcome<string>) => void = () => undefined
      processUtterance.mockReturnValue(
        new Promise<Outcome<string>>((resolve) => (resolveTurn = resolve)),
      )
      renderPanel()
      await userEvent.type(screen.getByRole('textbox', { name: 'Instruction' }), 'do it')

      await userEvent.click(screen.getByRole('button', { name: 'Send' }))

      expect(screen.queryByRole('button', { name: 'Send' })).toBeNull()
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

  describe('when cancelling', () => {
    let cancelTurn: Mock<[], void>
    let resolveTurn: (value: Outcome<string>) => void

    beforeEach(() => {
      cancelTurn = vi.fn()
      resolveTurn = () => undefined
      processUtterance.mockReturnValue(
        new Promise<Outcome<string>>((resolve) => (resolveTurn = resolve)),
      )
    })

    const startTurn = async () => {
      renderPanel({ cancelTurn })
      await userEvent.type(screen.getByRole('textbox', { name: 'Instruction' }), 'do it')
      await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    }

    it('renders Cancel in place of Send when a turn is thinking', async () => {
      await startTurn()

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()

      resolveTurn(Outcomes.success('ok'))
      await waitFor(() => expect(screen.getByText('ok')).toBeTruthy())
    })

    it('cancels the turn when Cancel is clicked while thinking', async () => {
      await startTurn()

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(cancelTurn).toHaveBeenCalled()

      resolveTurn(Outcomes.cancelled('chat'))
      await waitFor(() => expect(screen.getByText(/Stopped/)).toBeTruthy())
    })

    it('disables Cancel once clicked, so a second click does nothing', async () => {
      await startTurn()

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.getByRole('button', { name: 'Cancel' }).hasAttribute('disabled')).toBe(true)

      resolveTurn(Outcomes.cancelled('chat'))
      await waitFor(() => expect(screen.getByText(/Stopped/)).toBeTruthy())
    })

    it('names the notes the turn wrote when the cancellation lands', async () => {
      await startTurn()
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      resolveTurn(Outcomes.cancelled('chat', ['Journal/day.md']))

      await waitFor(() =>
        expect(screen.getByText('Stopped. Already changed: Journal/day.md')).toBeTruthy(),
      )
    })

    it('says nothing changed when the turn wrote no note', async () => {
      await startTurn()
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      resolveTurn(Outcomes.cancelled('chat'))

      await waitFor(() => expect(screen.getByText('Stopped. Nothing was changed.')).toBeTruthy())
    })

    it('returns to Send once the cancellation lands, so the next utterance can go', async () => {
      await startTurn()
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      resolveTurn(Outcomes.cancelled('chat'))

      await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy())
    })
  })

  describe('when the panel is idle', () => {
    it('renders Send rather than Cancel', () => {
      renderPanel()

      expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
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

  describe('when the header names the target note', () => {
    it('names the note when the session is bound', () => {
      renderPanel()

      expect(screen.getByText('note')).toBeTruthy()
    })

    it('says no note is open when the session is unbound', () => {
      renderPanel({ noteName: null })

      expect(screen.getByText('No note open')).toBeTruthy()
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

    it('offers no way back to the starting note when a change is reported', () => {
      renderPanel({ onTargetNoteChanged })

      retargetTo('Journal/2026-09-02.md')

      expect(screen.queryByRole('button', { name: /Return to/ })).toBeNull()
    })

    it('names the opened note when an unbound session binds', () => {
      renderPanel({ noteName: null, onTargetNoteChanged })

      retargetTo('Journal/2026-09-02.md')

      expect(screen.getByText('2026-09-02')).toBeTruthy()
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
