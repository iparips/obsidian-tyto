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

    it('renders the note path beneath the note name when the session is bound', () => {
      renderPanel({ notePath: 'Journal/note.md' })

      expect(screen.getByLabelText('Note path').textContent).toBe('Journal/note.md')
    })

    it('renders no path when the session is unbound', () => {
      renderPanel({ noteName: null, notePath: null })

      expect(screen.queryByLabelText('Note path')).toBeNull()
    })

    it('updates the path as well as the name when the target note changes', () => {
      renderPanel({ notePath: 'note.md', onTargetNoteChanged })

      retargetTo('Journal/2026-09-02.md')

      expect(screen.getByLabelText('Note path').textContent).toBe('Journal/2026-09-02.md')
    })
  })

  describe('when the model asks which note it should open', () => {
    let askPanel: (request: {
      candidates: readonly string[]
      purpose: string
    }) => Promise<string | null>
    const onChoiceRequested = (
      listener: (request: {
        candidates: readonly string[]
        purpose: string
      }) => Promise<string | null>,
    ) => {
      askPanel = listener
      return () => undefined
    }

    // The turn is parked on this promise, so the test holds it the way the
    // engine does and asserts what the panel does while it waits.
    const requestChoice = (candidates = ['Lists/todo.md', 'Lists/shopping.md']) => {
      let answer: Promise<string | null> = Promise.resolve(null)
      act(() => {
        answer = askPanel({ candidates, purpose: 'add toilet paper' })
      })
      return answer
    }

    // The turn never settles, so the panel stays in a running phase the way it
    // does while the engine waits on the model.
    beforeEach(() => {
      processUtterance.mockReturnValue(new Promise<Outcome<string>>(() => undefined))
      renderPanel({ onChoiceRequested })
    })

    it('says what the pick is for when a shortlist is offered', async () => {
      requestChoice()

      expect(screen.getByText('add toilet paper')).toBeTruthy()
    })

    it('names every candidate with its full path when a shortlist is offered', async () => {
      requestChoice()

      expect(screen.getByRole('button', { name: 'Choose Lists/todo.md' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Choose Lists/shopping.md' })).toBeTruthy()
    })

    it('offers a decline beside the candidates when a shortlist is offered', async () => {
      requestChoice()

      expect(screen.getByRole('button', { name: 'Decline every note' })).toBeTruthy()
    })

    it('offers the one candidate as a row when the shortlist holds one note', async () => {
      requestChoice(['Lists/todo.md'])

      expect(screen.getByRole('button', { name: 'Choose Lists/todo.md' })).toBeTruthy()
    })

    it('answers the picked path when a candidate is clicked', async () => {
      const answer = requestChoice()

      await userEvent.click(screen.getByRole('button', { name: 'Choose Lists/shopping.md' }))

      expect(await answer).toBe('Lists/shopping.md')
    })

    it('answers null when the decline is clicked', async () => {
      const answer = requestChoice()

      await userEvent.click(screen.getByRole('button', { name: 'Decline every note' }))

      expect(await answer).toBeNull()
    })

    it('replaces the rows with the outcome once answered', async () => {
      requestChoice()

      await userEvent.click(screen.getByRole('button', { name: 'Choose Lists/todo.md' }))

      expect(screen.queryByRole('button', { name: 'Choose Lists/todo.md' })).toBeNull()
    })

    it('names the note the user picked once answered', async () => {
      requestChoice()

      await userEvent.click(screen.getByRole('button', { name: 'Choose Lists/todo.md' }))

      expect(screen.getByText('Chose Lists/todo.md')).toBeTruthy()
    })

    it('says the shortlist was declined once declined', async () => {
      requestChoice()

      await userEvent.click(screen.getByRole('button', { name: 'Decline every note' }))

      expect(screen.getByText('Declined every note offered')).toBeTruthy()
    })

    it('disables the input row while choosing, so no utterance queues behind it', async () => {
      requestChoice()

      expect(screen.getByLabelText('Instruction').hasAttribute('disabled')).toBe(true)
    })

    it('answers null when the turn is cancelled while choosing', async () => {
      const answer = requestChoice()

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(await answer).toBeNull()
    })
  })

  describe('when the model asks the user a question', () => {
    let askPanel: (request: { question: string; suggestions: readonly string[] }) => Promise<string>
    const onQuestionAsked = (
      listener: (request: { question: string; suggestions: readonly string[] }) => Promise<string>,
    ) => {
      askPanel = listener
      return () => undefined
    }

    // The turn is parked on this promise, so the test holds it the way the
    // engine does and asserts what the panel does while it waits.
    const askQuestion = (suggestions: readonly string[] = ['Lists/a.md', 'Lists/b.md']) => {
      let answer: Promise<string> = Promise.resolve('')
      act(() => {
        answer = askPanel({ question: 'Which shopping list?', suggestions })
      })
      return answer
    }

    beforeEach(() => {
      processUtterance.mockReturnValue(new Promise<Outcome<string>>(() => undefined))
      renderPanel({ onQuestionAsked })
    })

    it('renders the question text when a question is asked', () => {
      askQuestion()

      expect(screen.getByText('Which shopping list?')).toBeTruthy()
    })

    it('renders a button per suggestion when suggestions are offered', () => {
      askQuestion()

      expect(screen.getByLabelText('Suggested answers').querySelectorAll('button')).toHaveLength(2)
    })

    it('renders no suggestion buttons when none are offered', () => {
      askQuestion([])

      expect(screen.getByLabelText('Suggested answers').querySelectorAll('button')).toHaveLength(0)
    })

    it('leaves the input live while asking, unlike while thinking', () => {
      askQuestion()

      expect(screen.getByLabelText('Instruction').hasAttribute('disabled')).toBe(false)
    })

    it('fills the input when a suggestion is clicked', async () => {
      askQuestion()

      await userEvent.click(screen.getByRole('button', { name: 'Lists/a.md' }))

      expect(screen.getByLabelText<HTMLInputElement>('Instruction').value).toBe('Lists/a.md')
    })

    it('sends nothing on its own when a suggestion is clicked', async () => {
      const answer = askQuestion()
      let settled = false
      void answer.then(() => (settled = true))

      await userEvent.click(screen.getByRole('button', { name: 'Lists/a.md' }))

      expect(settled).toBe(false)
    })

    it('answers with the typed text when the user sends while asking', async () => {
      const answer = askQuestion()

      await userEvent.type(screen.getByLabelText('Instruction'), 'the one in Lists{Enter}')

      expect(await answer).toBe('the one in Lists')
    })

    it('starts no new turn when the user sends while asking', async () => {
      askQuestion()

      await userEvent.type(screen.getByLabelText('Instruction'), 'the one in Lists{Enter}')

      expect(processUtterance).not.toHaveBeenCalled()
    })

    it('answers with an empty answer when the turn is cancelled while asking', async () => {
      const answer = askQuestion()

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(await answer).toBe('')
    })

    it('keeps the question text on screen when the turn is cancelled while asking', async () => {
      askQuestion()

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.getByText('Which shopping list?')).toBeTruthy()
    })
  })

  describe('when a turn ends with the panel closed', () => {
    it('reports the summary when a turn finishes', async () => {
      const onTurnFinished = vi.fn()
      renderPanel({ onTurnFinished })

      await userEvent.type(screen.getByLabelText('Instruction'), 'do it{Enter}')

      expect(onTurnFinished).toHaveBeenCalledWith('made the edit')
    })

    it('reports the message when a turn fails', async () => {
      const onTurnFailed = vi.fn()
      processUtterance.mockResolvedValue(Outcomes.failure('chat', 'it broke'))
      renderPanel({ onTurnFailed })

      await userEvent.type(screen.getByLabelText('Instruction'), 'do it{Enter}')

      expect(onTurnFailed).toHaveBeenCalledWith('it broke')
    })

    it('reports nothing when the turn is cancelled, since the user stopped it', async () => {
      const onTurnFinished = vi.fn()
      const onTurnFailed = vi.fn()
      processUtterance.mockResolvedValue(Outcomes.cancelled('chat', []))
      renderPanel({ onTurnFinished, onTurnFailed })

      await userEvent.type(screen.getByLabelText('Instruction'), 'do it{Enter}')

      expect(onTurnFinished).not.toHaveBeenCalled()
      expect(onTurnFailed).not.toHaveBeenCalled()
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

  describe('when a turn runs low on steps', () => {
    it('renders a warning entry when a warning is reported', () => {
      let warn: (text: string) => void = () => undefined
      renderPanel({
        onWarning: (listener) => {
          warn = listener
          return () => undefined
        },
      })

      act(() => warn('Owl is taking longer than usual: 3 steps left this turn.'))

      expect(
        screen.getByText('Owl is taking longer than usual: 3 steps left this turn.'),
      ).toBeTruthy()
    })
  })
})
