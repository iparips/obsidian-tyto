import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionPanel, RecorderPort, SessionPanelProps } from '../SessionPanel'
import { Utterance } from '../../../recorder'
import { Attempt, Outcome, Outcomes } from '../../../shared/models/outcome'
import { RetargetReport } from '../../session-listeners'

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
      stream: vi.fn().mockReturnValue(null),
    }
    transcribe = vi.fn().mockResolvedValue(Outcomes.success('spoken words'))
    processUtterance = vi.fn().mockResolvedValue(Outcomes.success('made the edit'))
  })

  const hiddenListeners: (() => void)[] = []
  const onObsidianBackgrounded = (listener: () => void) => {
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
        onObsidianBackgrounded={onObsidianBackgrounded}
        {...overrides}
      />,
    )

  describe('when using the mic', () => {
    it('transitions to recording when the mic button is clicked in idle', async () => {
      renderPanel()

      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      expect(screen.getByRole('button', { name: 'Send recording' })).toBeTruthy()
    })

    it('carries the accent colour on the record button while recording', async () => {
      renderPanel()

      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      expect(screen.getByRole('button', { name: 'Send recording' }).className).toBe(
        'tyto-recording-button',
      )
    })

    it('leaves the record button unaccented while idle', () => {
      renderPanel()

      expect(screen.getByRole('button', { name: 'Record' }).className).toBe('')
    })

    it('shows the recording strip in the history while recording', async () => {
      renderPanel()

      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      expect(screen.getByLabelText('Recording')).toBeTruthy()
    })

    it('transitions to transcribing when the mic is clicked while recording', async () => {
      let resolveTranscribe: (value: Attempt<string>) => void = () => undefined
      transcribe.mockReturnValue(
        new Promise<Attempt<string>>((resolve) => (resolveTranscribe = resolve)),
      )
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await userEvent.click(screen.getByRole('button', { name: 'Send recording' }))

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

      await userEvent.click(screen.getByRole('button', { name: 'Send recording' }))

      await waitFor(() => expect(screen.getByText('spoken words')).toBeTruthy())
    })

    it('renders an assistant entry when the turn summary arrives', async () => {
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await userEvent.click(screen.getByRole('button', { name: 'Send recording' }))

      await waitFor(() => expect(screen.getByText('made the edit')).toBeTruthy())
    })

    it('renders an error entry naming the step when an outcome fails', async () => {
      processUtterance.mockResolvedValue(Outcomes.failure('chat', 'model unavailable'))
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await userEvent.click(screen.getByRole('button', { name: 'Send recording' }))

      await waitFor(() => expect(screen.getByText('chat failed: model unavailable')).toBeTruthy())
    })

    it('starts no turn when the transcript came back with nothing said', async () => {
      transcribe.mockResolvedValue(Outcomes.success('   '))
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await userEvent.click(screen.getByRole('button', { name: 'Send recording' }))

      await waitFor(() => expect(screen.getByRole('button', { name: 'Record' })).toBeTruthy())
      expect(processUtterance).not.toHaveBeenCalled()
    })

    it('leaves the history empty when the transcript came back with nothing said', async () => {
      transcribe.mockResolvedValue(Outcomes.success(''))
      const { container } = renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await userEvent.click(screen.getByRole('button', { name: 'Send recording' }))

      await waitFor(() => expect(screen.getByRole('button', { name: 'Record' })).toBeTruthy())
      expect(container.querySelectorAll('.tyto-history > *')).toHaveLength(0)
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
    it('stops rather than cancels when hidden while recording', async () => {
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      goToBackground()

      expect(recorder.stop).toHaveBeenCalled()
      expect(recorder.cancel).not.toHaveBeenCalled()
      await waitFor(() => expect(screen.getByText('made the edit')).toBeTruthy())
    })

    it('runs the turn on what was captured when hidden while recording', async () => {
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      goToBackground()

      await waitFor(() => expect(processUtterance).toHaveBeenCalledWith('spoken words'))
    })

    it('puts the words in the history when hidden while recording', async () => {
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      goToBackground()

      await waitFor(() => expect(screen.getByText('spoken words')).toBeTruthy())
    })

    it('announces nothing, since the turn is the record', async () => {
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      goToBackground()

      await waitFor(() => expect(screen.getByText('made the edit')).toBeTruthy())
      expect(screen.queryByText(/discarded/)).toBeNull()
    })

    it('leaves the recorder alone when hidden while idle', () => {
      renderPanel()

      goToBackground()

      expect(recorder.stop).not.toHaveBeenCalled()
      expect(recorder.cancel).not.toHaveBeenCalled()
    })
  })

  describe('when the panel unmounts', () => {
    it('stops rather than cancels when unmounted while recording', async () => {
      const panel = renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await act(async () => panel.unmount())

      expect(recorder.stop).toHaveBeenCalled()
      expect(recorder.cancel).not.toHaveBeenCalled()
    })

    it('runs the turn on what was captured when unmounted while recording', async () => {
      const panel = renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await act(async () => panel.unmount())

      await waitFor(() => expect(processUtterance).toHaveBeenCalledWith('spoken words'))
    })

    it('leaves the recorder alone when unmounted while idle', async () => {
      const panel = renderPanel()

      await act(async () => panel.unmount())

      expect(recorder.stop).not.toHaveBeenCalled()
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

  // D4: the note left the header, since a target belongs to the turn that chose
  // it and a header naming one cannot say which utterance it belongs to.
  describe('when the panel is rendered', () => {
    it('names no note in the header, whatever the session is on', () => {
      const { container } = renderPanel({ notePath: 'Journal/note.md' })

      expect(container.querySelector('.tyto-header-target')).toBeNull()
      expect(screen.queryByLabelText('Note path')).toBeNull()
    })
  })

  describe('when a turn names the note it is writing to', () => {
    const targetListeners: ((report: RetargetReport) => void)[] = []
    const onTargetNoteChanged = (listenerFn: (report: RetargetReport) => void) => {
      targetListeners.push(listenerFn)
      return () => targetListeners.splice(targetListeners.indexOf(listenerFn), 1)
    }
    const retargetTo = (path: string | null, byUser = false) =>
      act(() => targetListeners.forEach((listenerFn) => listenerFn({ path, byUser })))

    const speak = async () => {
      await userEvent.type(screen.getByRole('textbox'), 'add milk')
      await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    }

    beforeEach(() => {
      targetListeners.length = 0
    })

    // D5: most utterances name no note, and the session's note is the answer
    // for those rather than a guess.
    it('names the session note the turn started on', async () => {
      processUtterance.mockReturnValue(new Promise(() => undefined))
      renderPanel({ notePath: 'Lists/todo.md' })

      await speak()

      expect(screen.getByText('Edit target: todo')).toBeTruthy()
      expect(screen.getByText('Lists/todo.md')).toBeTruthy()
    })

    // A turn resolves its target from what the user said, so showing it above
    // the utterance claims the note was settled before they spoke.
    it('shows the target below the utterance rather than above it', async () => {
      processUtterance.mockReturnValue(new Promise(() => undefined))
      const { container } = renderPanel({ notePath: 'Lists/todo.md' })

      await speak()

      const text = container.textContent ?? ''
      expect(text.indexOf('add milk')).toBeLessThan(text.indexOf('Edit target: todo'))
    })

    // A weekly note's name repeats every week, so the name alone does not say
    // which note a turn edited. The path under it does.
    it('shows the whole path under the name', async () => {
      processUtterance.mockReturnValue(new Promise(() => undefined))
      renderPanel({ notePath: '1 - Journal/Weekly/Week-38/shopping-list.md' })

      await speak()

      expect(screen.getByText('1 - Journal/Weekly/Week-38/shopping-list.md')).toBeTruthy()
    })

    it('names no note when the session is on none', async () => {
      processUtterance.mockReturnValue(new Promise(() => undefined))
      renderPanel({ noteName: null, notePath: null })

      await speak()

      expect(screen.getByText('Edit target: no note')).toBeTruthy()
    })

    it('names the new note once a tool opens one mid-turn', async () => {
      processUtterance.mockReturnValue(new Promise(() => undefined))
      renderPanel({ notePath: 'Lists/todo.md', onTargetNoteChanged })
      await speak()

      retargetTo('Lists/shopping.md')

      expect(screen.getByText('Edit target: shopping')).toBeTruthy()
      expect(screen.getByText('Lists/shopping.md')).toBeTruthy()
    })

    it('leaves an earlier turn naming the note it wrote to', async () => {
      renderPanel({ notePath: 'Lists/todo.md', onTargetNoteChanged })
      await speak()

      retargetTo('Lists/shopping.md', true)
      await speak()

      expect(screen.getAllByText('Edit target: todo')).toHaveLength(1)
      expect(screen.getAllByText('Edit target: shopping')).toHaveLength(1)
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

    // A suggestion is a whole answer and FR19 is that the user picks one
    // without typing. Filling the box still asks them to press send, which is
    // typing-adjacent work to confirm a choice they already made.
    it('answers the question when a suggestion is clicked', async () => {
      const answer = askQuestion()

      await userEvent.click(screen.getByRole('button', { name: 'Lists/a.md' }))

      expect(await answer).toBe('Lists/a.md')
    })

    it('leaves the input empty when a suggestion is clicked, since it was sent', async () => {
      askQuestion()

      await userEvent.click(screen.getByRole('button', { name: 'Lists/a.md' }))

      expect(screen.getByLabelText<HTMLInputElement>('Instruction').value).toBe('')
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
      const notifySucceeded = vi.fn()
      renderPanel({ notifySucceeded })

      await userEvent.type(screen.getByLabelText('Instruction'), 'do it{Enter}')

      expect(notifySucceeded).toHaveBeenCalledWith('made the edit')
    })

    it('reports the message when a turn fails', async () => {
      const notifyFailed = vi.fn()
      processUtterance.mockResolvedValue(Outcomes.failure('chat', 'it broke'))
      renderPanel({ notifyFailed })

      await userEvent.type(screen.getByLabelText('Instruction'), 'do it{Enter}')

      expect(notifyFailed).toHaveBeenCalledWith('it broke')
    })

    it('reports nothing when the turn is cancelled, since the user stopped it', async () => {
      const notifySucceeded = vi.fn()
      const notifyFailed = vi.fn()
      processUtterance.mockResolvedValue(Outcomes.cancelled('chat', []))
      renderPanel({ notifySucceeded, notifyFailed })

      await userEvent.type(screen.getByLabelText('Instruction'), 'do it{Enter}')

      expect(notifySucceeded).not.toHaveBeenCalled()
      expect(notifyFailed).not.toHaveBeenCalled()
    })
  })

  describe('when a turn runs a command or answers', () => {
    const answerListeners: ((report: { text: string; sources: string[] }) => void)[] = []
    const onAnswer = (listener: (report: { text: string; sources: string[] }) => void) => {
      answerListeners.push(listener)
      return () => answerListeners.splice(answerListeners.indexOf(listener), 1)
    }

    beforeEach(() => {
      answerListeners.length = 0
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

      act(() => warn('Tyto is taking longer than usual: 3 steps left this turn.'))

      expect(
        screen.getByText('Tyto is taking longer than usual: 3 steps left this turn.'),
      ).toBeTruthy()
    })
  })

  // The channel the header reads, so the header says which note the next turn
  // opens on. The timeline says nothing: the turn's target already names it.
  describe('when the session moves to a different note', () => {
    const renderRetargeting = () => {
      let retarget: (report: RetargetReport) => void = () => undefined
      renderPanel({
        onTargetNoteChanged: (listener) => {
          retarget = listener
          return () => undefined
        },
      })
      return (path: string | null, byUser = true) => act(() => retarget({ path, byUser }))
    }

    it('renders no entry when the user moved the note themselves', () => {
      const retarget = renderRetargeting()

      retarget('Lists/todo.md')

      expect(screen.queryByText('Now editing todo.')).toBeNull()
    })

    // A tool that opened a note published its own step saying so, and moves the
    // open turn's target rather than leaving a line beside it.
    it('renders no entry when a tool moved the note, since its step said so', () => {
      const retarget = renderRetargeting()

      retarget('Lists/todo.md', false)

      expect(screen.queryByText('Now editing todo.')).toBeNull()
    })
  })

  describe('when a transcription fails', () => {
    const anUtterance = new Utterance(new Blob(['a']), 'audio/webm')

    const failTranscription = async () => {
      transcribe.mockResolvedValue(Outcomes.failure('transcription', 'rate limited'))
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))
      await userEvent.click(screen.getByRole('button', { name: 'Send recording' }))
    }

    it('offers a retry when the failure lands', async () => {
      await failTranscription()

      await waitFor(() => expect(screen.getByLabelText('Retry transcription')).toBeTruthy())
    })

    it('sends the same audio when the user retries', async () => {
      await failTranscription()
      await waitFor(() => expect(screen.getByLabelText('Retry transcription')).toBeTruthy())
      transcribe.mockClear()

      await userEvent.click(screen.getByLabelText('Retry transcription'))

      expect(transcribe).toHaveBeenCalledWith(anUtterance.blob, 'audio/webm')
    })

    it('makes no new recording when the user retries', async () => {
      await failTranscription()
      await waitFor(() => expect(screen.getByLabelText('Retry transcription')).toBeTruthy())
      const stops = (recorder.stop as Mock).mock.calls.length

      await userEvent.click(screen.getByLabelText('Retry transcription'))

      expect((recorder.stop as Mock).mock.calls).toHaveLength(stops)
    })

    it('runs the turn when the retry transcribes', async () => {
      await failTranscription()
      await waitFor(() => expect(screen.getByLabelText('Retry transcription')).toBeTruthy())
      transcribe.mockResolvedValue(Outcomes.success('spoken words'))

      await userEvent.click(screen.getByLabelText('Retry transcription'))

      await waitFor(() => expect(processUtterance).toHaveBeenCalledWith('spoken words'))
    })

    it('takes the control away when the retry transcribes', async () => {
      await failTranscription()
      await waitFor(() => expect(screen.getByLabelText('Retry transcription')).toBeTruthy())
      transcribe.mockResolvedValue(Outcomes.success('spoken words'))

      await userEvent.click(screen.getByLabelText('Retry transcription'))

      await waitFor(() => expect(screen.queryByLabelText('Retry transcription')).toBeNull())
    })

    it('keeps offering a retry when the retry fails too', async () => {
      await failTranscription()
      await waitFor(() => expect(screen.getByLabelText('Retry transcription')).toBeTruthy())

      await userEvent.click(screen.getByLabelText('Retry transcription'))

      await waitFor(() => expect(screen.getAllByLabelText('Retry transcription')).toHaveLength(2))
    })

    it('takes the control away when the user records again', async () => {
      await failTranscription()
      await waitFor(() => expect(screen.getByLabelText('Retry transcription')).toBeTruthy())

      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      expect(screen.queryByLabelText('Retry transcription')).toBeNull()
    })

    it('sends the new audio rather than the held one once a new recording is made', async () => {
      await failTranscription()
      await waitFor(() => expect(screen.getByLabelText('Retry transcription')).toBeTruthy())
      const second = new Utterance(new Blob(['b']), 'audio/mp4')
      ;(recorder.stop as Mock).mockResolvedValue(second)
      transcribe.mockResolvedValue(Outcomes.success('said again'))

      await userEvent.click(screen.getByRole('button', { name: 'Record' }))
      await userEvent.click(screen.getByRole('button', { name: 'Send recording' }))

      await waitFor(() => expect(transcribe).toHaveBeenLastCalledWith(second.blob, 'audio/mp4'))
    })

    it('offers a retry when the failure came from a backgrounded send', async () => {
      transcribe.mockResolvedValue(Outcomes.failure('transcription', 'rate limited'))
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      goToBackground()

      await waitFor(() => expect(screen.getByLabelText('Retry transcription')).toBeTruthy())
    })
  })

  describe('when the user cancels a recording', () => {
    it('offers no retry afterwards, since the user chose to lose it', async () => {
      transcribe.mockResolvedValue(Outcomes.failure('transcription', 'rate limited'))
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))
      await userEvent.click(screen.getByRole('button', { name: 'Send recording' }))
      await waitFor(() => expect(screen.getByLabelText('Retry transcription')).toBeTruthy())
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByLabelText('Retry transcription')).toBeNull()
    })
  })

  describe('when a chat failure lands', () => {
    it('offers no retry, since nothing but a transcription has audio behind it', async () => {
      processUtterance.mockResolvedValue(Outcomes.failure('chat', 'model unavailable'))
      renderPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Record' }))

      await userEvent.click(screen.getByRole('button', { name: 'Send recording' }))

      await waitFor(() => expect(screen.getByText('chat failed: model unavailable')).toBeTruthy())
      expect(screen.queryByLabelText('Retry transcription')).toBeNull()
    })
  })
})
