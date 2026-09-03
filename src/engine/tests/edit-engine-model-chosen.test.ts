import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { App } from 'obsidian'
import { SessionRepository } from '../../session/session-repository'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { HarnessTools } from '../harness-tools'
import { NoteChoice } from '../note-choice'
import { NoteOpener } from '../note-opener'
import { TurnCancellation } from '../turn-cancellation'
import { ChosenNotes } from '../models/chosen-notes'
import { UserQuestion } from '../user-question'
import { AnswerRequest } from '../models/answer-request'
import { Outcomes } from '../../shared/models/outcome'
import { ChatMessage, ChatProvider } from '../../providers/types'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { AllowList } from '../../commands/allow-list'
import { CommandCatalogue } from '../../commands/command-catalogue'
import { CommandRegistry } from '../../commands/command-registry'
import { CommandRunner } from '../../commands/command-runner'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { NoteGlob } from '../../search/note-glob'
import { NoteGrep } from '../../search/note-grep'
import { SearchTools } from '../search-tools'
import { NoteReader } from '../../search/note-reader'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeVault } from '../../test-support/fake-vault'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'
import { FakeWorkspace } from '../../test-support/fake-workspace'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { aSession, aTextTurn, aToolCall, aToolTurn, anEngine } from '../../test-support/builders'

const TODO = 'Journal/Weekly/Week-36/todo.md'

describe('EditEngine', () => {
  let editor: FakeEditor
  let todoEditor: FakeEditor
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let vault: FakeVault
  let sessions: SessionRepository
  let noteLocator: FakeNoteLocator
  let retargets: string[]
  let asked: string[]
  let questions: AnswerRequest[]
  let steps: string[]

  beforeEach(() => {
    vi.clearAllMocks()
    editor = new FakeEditor('# Budget\n\nbody')
    todoEditor = new FakeEditor('# Todo\n\n- [ ] milk\n')
    complete = vi.fn()
    vault = new FakeVault().withNote(TODO, '# Todo\n\n- [ ] milk\n')
    sessions = aSession()
    retargets = []
    asked = []
    questions = []
    steps = []
    noteLocator = new FakeNoteLocator()
      .withOpenNote('note.md', editor)
      .withOpenNote(TODO, todoEditor)
  })

  const harnessOf = (): HarnessTools => {
    const app = {
      ...new FakeCommandRegistry().asApp(),
      workspace: new FakeWorkspace('note.md').asWorkspace(),
    } as unknown as App
    const registry = new CommandRegistry(app)
    const catalogue = new CommandCatalogue(registry, new AllowList([]))
    return new HarnessTools(
      new CommandRunner(app, catalogue, new OpenedNoteWait(app, 30), registry),
      new NoteReader(vault.asVault()),
      catalogue,
      true,
      new SearchTools(new NoteGlob(vault.asVault()), new NoteGrep(vault.asVault())),
    )
  }

  const engineOf = (
    buildChoice: (cancellation: TurnCancellation, chosen: ChosenNotes) => NoteChoice = (
      _cancellation,
      chosen,
    ) => NoteChoice.automatic(chosen),
    answer = '',
    noteOpener: NoteOpener | null = null,
  ) =>
    anEngine(
      { complete },
      {
        sessions,
        noteLocator,
        agentsMdRepository: new AgentsMdRepository(new FakeAdapter().asAdapter()),
        harnessTools: harnessOf(),
        noteChoice: buildChoice,
        noteOpener,
        userQuestion: () =>
          UserQuestion.of((request) => {
            questions.push(request)
            return Promise.resolve(answer)
          }),
        progress: new TurnProgressPublisher(
          () => undefined,
          (path) => retargets.push(path),
          () => undefined,
          () => undefined,
          () => undefined,
          (step) => steps.push(`${step.label}: ${step.detail}`),
        ),
      },
    )

  // Picks the named path when it is offered, so a test states which note the
  // user pointed at rather than wiring a choice per case. A null declines.
  const picking = (pick: string | null) => (_cancellation: TurnCancellation, chosen: ChosenNotes) =>
    NoteChoice.of(
      (request) => {
        asked.push(...request.candidates)
        return Promise.resolve(request.candidates.includes(pick ?? '') ? pick : null)
      },
      new TurnCancellation(),
      chosen,
    )

  const respondsWith = (...turns: ReturnType<typeof aToolTurn>[]) => {
    turns.forEach((turn) => complete.mockResolvedValueOnce(Outcomes.success(turn)))
    complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))
  }

  // A glob rather than a search: this helper exists to put a path in SeenPaths
  // so open_note will accept it, and a glob does that as well as a search did.
  const findsTodo = () =>
    aToolTurn(aToolCall('glob_notes', { pattern: 'Journal/Weekly/Week-36/*.md' }))

  const offersTodo = () =>
    aToolTurn(aToolCall('choose_note', { paths: [TODO], purpose: 'add toilet paper' }))

  const opensTodo = () => aToolTurn(aToolCall('open_note', { path: TODO }))

  const addsLineToStart = () =>
    aToolTurn(aToolCall('insert_at', { location: 'note_start', content: 'A new line.\n' }))

  const addsItem = () =>
    aToolTurn(
      aToolCall('insert_text', {
        anchor_text: '- [ ] milk',
        position: 'after',
        content: '\n- [ ] toilet paper',
      }),
    )

  const toolResultsOf = (callIndex: number) =>
    complete.mock.calls[callIndex][0].filter((message: ChatMessage) => message.isToolResult())

  describe('when the user picks the note offered', () => {
    it('opens the note the user picked and edits it, end to end', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo(), addsItem())

      await engineOf(picking(TODO)).processUtterance('add toilet paper to my todo')

      expect(todoEditor.content).toBe('# Todo\n\n- [ ] milk\n- [ ] toilet paper\n')
    })

    it('moves the target note when the user picks it', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo())

      await engineOf(picking(TODO)).processUtterance('open my todo')

      expect(sessions.targetNote()).toBe(TODO)
    })

    it('publishes the retarget when the user picks it, so the header follows', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo())

      await engineOf(picking(TODO)).processUtterance('open my todo')

      expect(retargets).toEqual([TODO])
    })

    it('offers the note it found when a shortlist is offered', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo())

      await engineOf(picking(TODO)).processUtterance('open my todo')

      expect(asked).toEqual([TODO])
    })

    it('tells the model which path was chosen when the user picks one', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo())

      await engineOf(picking(TODO)).processUtterance('open my todo')

      expect(toolResultsOf(2).at(-1)).toMatchObject({
        content: `the user chose ${TODO}; open it with open_note`,
      })
    })

    it('asks once across a two-step instruction, so the edit after the open does not ask again', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo(), addsItem())

      await engineOf(picking(TODO)).processUtterance('open my todo and add visit doctor')

      expect(asked).toEqual([TODO])
    })

    // A command can move the target off the chosen note without the model
    // choosing to, so returning to it must cost no second question.
    it('reopens a note already chosen without asking again', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo(), opensTodo())

      await engineOf(picking(TODO)).processUtterance('open my todo')

      expect(asked).toEqual([TODO])
    })
  })

  // The bug this covers: open_note only retargeted, and retargeting resolves
  // against an editor. A note the user never had on screen had none, so the
  // model was told it "is not open for editing" and the turn stopped.
  describe('when the chosen note is not already open in an editor', () => {
    let closedLocator: FakeNoteLocator

    beforeEach(() => {
      closedLocator = new FakeNoteLocator()
        .withOpenNote('note.md', editor)
        .withClosedNote(TODO, todoEditor)
      noteLocator = closedLocator
    })

    const openerFor = () =>
      ({ open: (path: string) => Promise.resolve(closedLocator.opens(path)) }) as NoteOpener

    it('opens a chosen note that no editor is showing, so the edit can land', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo(), addsItem())

      await engineOf(picking(TODO), '', openerFor()).processUtterance('add toilet paper')

      expect(todoEditor.content).toBe('# Todo\n\n- [ ] milk\n- [ ] toilet paper\n')
    })

    it('tells the model the note opened rather than that it is not editable', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo())

      await engineOf(picking(TODO), '', openerFor()).processUtterance('add toilet paper')

      expect(toolResultsOf(3).at(-1)).toMatchObject({ content: `opened ${TODO}` })
    })

    it('says the note is not editable when nothing can open it, so the turn says why', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo())

      await engineOf(picking(TODO)).processUtterance('add toilet paper')

      expect(toolResultsOf(3).at(-1)).toMatchObject({
        content: `opened ${TODO}, but it is not editable yet`,
      })
    })
  })

  // The reported failure: the model globbed, was refused an unchosen open,
  // called choose_note, then edited without ever opening. The edit landed on the
  // binding the turn inherited, whose editor Obsidian still reported but no
  // longer showed, so the panel claimed an edit the file never received.
  describe('when the model edits without opening what it chose', () => {
    const offersStart = () =>
      aToolTurn(aToolCall('choose_note', { paths: ['note.md'], purpose: 'add a line' }))

    it('refuses an edit to the inherited note once the model has searched', async () => {
      respondsWith(findsTodo(), offersStart(), addsLineToStart())

      await engineOf(picking('note.md')).processUtterance('find the todo and add an item')

      expect(editor.content).toBe('# Budget\n\nbody')
    })

    it('tells the model to open the note before editing when it skipped the open', async () => {
      respondsWith(findsTodo(), offersStart(), addsLineToStart())

      await engineOf(picking('note.md')).processUtterance('find the todo and add an item')

      expect(toolResultsOf(3).at(-1)).toMatchObject({
        content:
          'note.md was not opened this turn; offer it with choose_note and open it before editing',
      })
    })

    it('applies the edit once the note is actually opened, so the guard is not a block', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo(), addsItem())

      await engineOf(picking(TODO)).processUtterance('find the todo and add an item')

      expect(todoEditor.content).toBe('# Todo\n\n- [ ] milk\n- [ ] toilet paper\n')
    })
  })

  // Plain dictation never searches, so the note the user is looking at stays
  // editable without a choice. The guard must not break the common case.
  describe('when the turn only edits the note it started on', () => {
    it('edits the inherited note when no search has run', async () => {
      respondsWith(addsLineToStart())

      await engineOf().processUtterance('add a line at the top')

      expect(editor.content).toBe('A new line.\n# Budget\n\nbody')
    })
  })

  describe('when the user declines every candidate', () => {
    it('leaves the target note unchanged when the user declines', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo())

      await engineOf(picking(null)).processUtterance('add toilet paper to my todo')

      expect(sessions.targetNote()).toBe('note.md')
    })

    it('writes to no note when the user declines', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo(), addsItem())

      await engineOf(picking(null)).processUtterance('add toilet paper to my todo')

      expect(todoEditor.content).toBe('# Todo\n\n- [ ] milk\n')
    })

    it('leaves the starting note untouched when the user declines', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo())

      await engineOf(picking(null)).processUtterance('add toilet paper to my todo')

      expect(editor.content).toBe('# Budget\n\nbody')
    })

    it('publishes no retarget when the user declines', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo())

      await engineOf(picking(null)).processUtterance('add toilet paper to my todo')

      expect(retargets).toEqual([])
    })

    it('tells the model to ask what they meant when the user declines every candidate', async () => {
      respondsWith(findsTodo(), offersTodo())

      await engineOf(picking(null)).processUtterance('add toilet paper to my todo')

      expect(toolResultsOf(2).at(-1)).toMatchObject({
        content:
          'the user declined every note offered; ask them what they meant rather than searching again',
      })
    })

    it('refuses the open of a note the user did not choose, naming choose_note', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo())

      await engineOf(picking(null)).processUtterance('add toilet paper to my todo')

      expect(toolResultsOf(3).at(-1)).toMatchObject({
        content: `${TODO} was not chosen by the user this turn; call choose_note with it now, then open it. Do not ask the user in prose`,
      })
    })

    it('ends the turn with a summary when the user declines', async () => {
      respondsWith(findsTodo(), offersTodo())

      const outcome = await engineOf(picking(null)).processUtterance('add toilet paper')

      expect(outcome.succeeded()).toBe(true)
    })
  })

  describe('when the model opens a note it never offered', () => {
    it('refuses an open the user never chose, naming choose_note', async () => {
      respondsWith(findsTodo(), opensTodo())

      await engineOf(picking(TODO)).processUtterance('add toilet paper to my todo')

      expect(sessions.targetNote()).toBe('note.md')
    })

    it('asks nothing when the model opens without offering', async () => {
      respondsWith(findsTodo(), opensTodo())

      await engineOf(picking(TODO)).processUtterance('add toilet paper to my todo')

      expect(asked).toEqual([])
    })
  })

  describe('when no search returned the path', () => {
    it('offers no shortlist when the path was never returned by a search', async () => {
      respondsWith(offersTodo())

      await engineOf(picking(TODO)).processUtterance('add toilet paper to my todo')

      expect(asked).toEqual([])
    })

    it('names the unsearched path rather than the choice when nothing was found', async () => {
      respondsWith(offersTodo())

      await engineOf(picking(TODO)).processUtterance('add toilet paper to my todo')

      expect(toolResultsOf(1).at(-1)).toMatchObject({
        content: `no search returned ${TODO}; search before offering them`,
      })
    })

    it('refuses the open when the path was never offered by a search', async () => {
      respondsWith(opensTodo())

      await engineOf(picking(TODO)).processUtterance('add toilet paper to my todo')

      expect(sessions.targetNote()).toBe('note.md')
    })
  })

  describe('when auto mode chooses without asking', () => {
    it('opens what the model found and edits it, end to end, in auto mode', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo(), addsItem())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(todoEditor.content).toBe('# Todo\n\n- [ ] milk\n- [ ] toilet paper\n')
    })

    it('refuses an unseen path in auto mode, so a refusal holds in both modes', async () => {
      respondsWith(opensTodo())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(sessions.targetNote()).toBe('note.md')
    })

    it('refuses an open the model never offered in auto mode, so the guard holds in both modes', async () => {
      respondsWith(findsTodo(), opensTodo())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(sessions.targetNote()).toBe('note.md')
    })
  })

  describe('when the model asks the user a question', () => {
    const asksWhich = () =>
      aToolTurn(
        aToolCall('ask_user', {
          question: 'Which shopping list?',
          suggestions: ['Lists/a.md', 'Lists/b.md'],
        }),
      )

    it('asks the question the model wrote when ask_user is called', async () => {
      respondsWith(asksWhich())

      await engineOf(undefined, 'the one in Lists').processUtterance('add milk to my list')

      expect(questions).toEqual([
        new AnswerRequest('Which shopping list?', ['Lists/a.md', 'Lists/b.md']),
      ])
    })

    it('feeds the answer back as the tool result when the user answers', async () => {
      respondsWith(asksWhich())

      await engineOf(undefined, 'the one in Lists').processUtterance('add milk to my list')

      expect(toolResultsOf(1)[0]).toMatchObject({
        content: 'the user answered: the one in Lists',
      })
    })

    it('tells the model nobody answered when the answer comes back empty', async () => {
      respondsWith(asksWhich())

      await engineOf(undefined, '').processUtterance('add milk to my list')

      expect(toolResultsOf(1)[0]).toMatchObject({
        content: 'the user did not answer; stop and say what you were waiting on',
      })
    })
  })

  describe('when the panel asks what the turn did', () => {
    it('reports a glob with its pattern and note count', async () => {
      respondsWith(findsTodo())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(steps).toEqual(['Globbed: Journal/Weekly/Week-36/*.md — 1 note'])
    })

    it('reports the choice as a step, naming how many notes were offered', async () => {
      respondsWith(findsTodo(), offersTodo())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(steps.at(-1)).toBe('Offered: 1 note to choose from')
    })

    it('reports the open when a model-chosen note opens', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(steps.at(-1)).toBe(`Opened: ${TODO}`)
    })

    it('reports a refusal when the user never chose the path, so a stuck turn says why', async () => {
      respondsWith(findsTodo(), opensTodo())

      await engineOf(picking(TODO)).processUtterance('add toilet paper to my todo')

      expect(steps.at(-1)).toBe(
        `Refused: ${TODO} was not chosen by the user this turn; call choose_note with it now, then open it. Do not ask the user in prose`,
      )
    })

    it('reports a refusal when a path was never offered, so a stuck turn says why', async () => {
      respondsWith(opensTodo())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(steps.at(-1)).toContain('Refused:')
    })

    it('reports the edit when one lands', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo(), addsItem())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(steps.at(-1)).toBe('Edit: applied')
    })
  })
})
