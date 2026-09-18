import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { App } from 'obsidian'
import { SessionRepository } from '../../session/session-repository'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { HarnessToolsService } from '../tools/harness-tools-service'
import { NoteChoiceService } from '../waiting/note-choice-service'
import { NoteOpener } from '../note-binding/note-opener'
import { TurnCancellationController } from '../turn/turn-cancellation-controller'
import { NotesChosenByUserRepository } from '../turn/notes-chosen-by-user-repository'
import { UserQuestionService } from '../waiting/user-question-service'
import { AnswerRequest } from '../waiting/answer-request'
import { Outcomes } from '../../shared/models/outcome'
import { ChatMessage, ChatProvider } from '../../model/providers/types'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { AllowList } from '../../commands/allow-list'
import { ObsidianCommandCatalogue } from '../../commands/obsidian-command-catalogue'
import { ObsidianCommandRegistry } from '../../commands/obsidian-command-registry'
import { ObsidianCommandRunner } from '../../commands/obsidian-command-runner'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { NoteGlob } from '../../search/note-glob'
import { NoteGrep } from '../../search/note-grep'
import { SearchToolsService } from '../tools/search-tools-service'
import { DateToolService } from '../tools/date-tool-service'
import { NoteReader } from '../../search/note-reader'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeVault } from '../../test-support/fake-vault'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'
import { FakeWorkspace } from '../../test-support/fake-workspace'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import {
  aSession,
  aTextTurn,
  aToolCall,
  aToolTurn,
  anEngine,
  stepTextOf,
} from '../../test-support/builders'

const TODO = 'Journal/Weekly/Week-36/todo.md'
const SHOPPING = 'Journal/Weekly/Week-36/shopping.md'

describe('EditEngine', () => {
  let editor: FakeEditor
  let todoEditor: FakeEditor
  let shoppingEditor: FakeEditor
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let vault: FakeVault
  let sessions: SessionRepository
  let noteLocator: FakeNoteLocator
  let retargets: (string | null)[]
  let asked: string[]
  let questions: AnswerRequest[]
  let steps: string[]

  beforeEach(() => {
    vi.clearAllMocks()
    editor = new FakeEditor('# Budget\n\nbody')
    todoEditor = new FakeEditor('# Todo\n\n- [ ] milk\n')
    shoppingEditor = new FakeEditor('# Shopping\n\n- bread\n')
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

  const harnessOf = (): HarnessToolsService => {
    const app = {
      ...new FakeCommandRegistry().asApp(),
      workspace: new FakeWorkspace('note.md').asWorkspace(),
    } as unknown as App
    const registry = new ObsidianCommandRegistry(app)
    const catalogue = new ObsidianCommandCatalogue(registry, new AllowList([]))
    return new HarnessToolsService(
      new ObsidianCommandRunner(app, catalogue, new OpenedNoteWait(app, 30), registry),
      new NoteReader(vault.asVault()),
      catalogue,
      true,
      new SearchToolsService(new NoteGlob(vault.asVault()), new NoteGrep(vault.asVault())),
      new DateToolService(),
    )
  }

  const engineOf = (
    buildChoice: (
      cancellation: TurnCancellationController,
      chosen: NotesChosenByUserRepository,
    ) => NoteChoiceService = (_cancellation, chosen) => NoteChoiceService.unasked(chosen),
    answer = '',
    noteOpener: NoteOpener | null = null,
  ) =>
    anEngine(
      { complete },
      {
        sessions,
        noteLocator,
        vault,
        agentsMdRepository: new AgentsMdRepository(new FakeVault().asVault()),
        harnessToolsService: harnessOf(),
        noteChoiceService: buildChoice,
        noteOpener,
        userQuestionService: () =>
          UserQuestionService.of((request) => {
            questions.push(request)
            return Promise.resolve(answer)
          }),
        progress: new TurnProgressPublisher(
          () => undefined,
          (path) => retargets.push(path),
          () => undefined,
          () => undefined,
          () => undefined,
          (step) => steps.push(stepTextOf(step)),
        ),
      },
    )

  // Picks the named path when it is offered, so a test states which note the
  // user pointed at rather than wiring a choice per case. A null declines.
  const picking =
    (pick: string | null) =>
    (_cancellation: TurnCancellationController, chosen: NotesChosenByUserRepository) =>
      NoteChoiceService.of(
        (request) => {
          asked.push(...request.candidates)
          return Promise.resolve(request.candidates.includes(pick ?? '') ? pick : null)
        },
        new TurnCancellationController(),
        chosen,
      )

  const respondsWith = (...turns: ReturnType<typeof aToolTurn>[]) => {
    turns.forEach((turn) => complete.mockResolvedValueOnce(Outcomes.success(turn)))
    complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))
  }

  // A glob rather than a search: this helper exists to put a path in PathsReturnedByVaultRepository
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

    // Even with no opener, so the note gains no editor at all: it is still the
    // turn's target and the write goes through the vault (D5). The panel is
    // what tells the user undo is not available.
    it('reports the note opened when nothing can open it', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo())

      await engineOf(picking(TODO)).processUtterance('add toilet paper')

      expect(toolResultsOf(3).at(-1)).toMatchObject({ content: `opened ${TODO}` })
    })
  })

  // The reported failure: the model globbed, was refused an unchosen open,
  // called choose_note, then edited without ever opening. Choosing moves no
  // binding, so the edit lands on the note the turn inherited, which is the
  // note the user still has in front of them. The step names it.
  describe('when the model edits without opening what it chose', () => {
    const offersStart = () =>
      aToolTurn(aToolCall('choose_note', { paths: ['note.md'], purpose: 'add a line' }))

    it('edits the note the turn started on after a search, since the target has not moved', async () => {
      respondsWith(findsTodo(), offersStart(), addsLineToStart())

      await engineOf(picking('note.md')).processUtterance('find the todo and add an item')

      expect(editor.content).toBe('A new line.\n# Budget\n\nbody')
    })

    it('edits the note the model opened after a choice, since the open moved the target', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo(), addsItem())

      await engineOf(picking(TODO)).processUtterance('find the todo and add an item')

      expect(todoEditor.content).toBe('# Todo\n\n- [ ] milk\n- [ ] toilet paper\n')
    })
  })

  // A step reads its note once, so a second open_note inside that step leaves
  // every following call anchored to a note the model was never shown.
  describe('when a step opens two notes at once', () => {
    beforeEach(() => {
      noteLocator.withOpenNote(SHOPPING, shoppingEditor)
    })

    // Each choice offers one path, which auto mode resolves without asking, so
    // both notes are chosen by the time the batch of opens runs.
    const choosesBoth = () =>
      aToolTurn(
        aToolCall('choose_note', { paths: [TODO], purpose: 'add an item' }),
        aToolCall('choose_note', { paths: [SHOPPING], purpose: 'add an item' }),
      )

    const opensBoth = () =>
      aToolTurn(aToolCall('open_note', { path: TODO }), aToolCall('open_note', { path: SHOPPING }))

    const findsBoth = () =>
      aToolTurn(aToolCall('glob_notes', { pattern: 'Journal/Weekly/Week-36/*.md' }))

    it('leaves the target on the note the first open moved it to', async () => {
      respondsWith(findsBoth(), choosesBoth(), opensBoth())

      await engineOf().processUtterance('open my todo and my shopping list')

      expect(sessions.targetNote()).toBe(TODO)
    })

    it('refuses the second open, so the target does not move twice', async () => {
      respondsWith(findsBoth(), choosesBoth(), opensBoth())

      await engineOf().processUtterance('open my todo and my shopping list')

      expect(toolResultsOf(3).at(-1)?.content).toContain('One note per step')
    })

    it('publishes the first move alone', async () => {
      respondsWith(findsBoth(), choosesBoth(), opensBoth())

      await engineOf().processUtterance('open my todo and my shopping list')

      expect(retargets).toEqual([TODO])
    })
  })

  // Plain dictation moves nothing, so the note the user is looking at is still
  // the target when the edit lands.
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

  // A turn reached for Thursday's note, had the open refused, and edited the
  // Friday note still bound from the turn before, reporting success on it.
  describe('when the model edits after an open was refused', () => {
    const editsNote = () =>
      aToolTurn(aToolCall('insert_at', { location: 'note_start', content: 'hi\n' }))

    it('leaves the note bound from the earlier turn untouched', async () => {
      respondsWith(findsTodo(), opensTodo(), editsNote())

      await engineOf(picking(TODO)).processUtterance('add a line to my todo')

      expect(editor.content).toBe('# Budget\n\nbody')
    })

    it('names the note whose open was refused rather than the one still bound', async () => {
      respondsWith(findsTodo(), opensTodo(), editsNote())

      await engineOf(picking(TODO)).processUtterance('add a line to my todo')

      expect(toolResultsOf(3).at(-1)).toMatchObject({
        content: `your open of ${TODO} was refused, so it is not the note this edit would reach; call choose_note with it, open it, then edit. Never edit the note bound from an earlier turn`,
      })
    })

    // Pinned rather than changed: refusedOpenPath is turn-scoped, so the note
    // the user has open is writable again on the next utterance. The reply is
    // what has to say so, or a user reads only that their request failed and
    // resets the session instead of repeating it.
    it('applies the edit to the open note on the utterance after the refusal', async () => {
      const engine = engineOf(picking(TODO))
      respondsWith(findsTodo(), opensTodo(), editsNote())
      await engine.processUtterance('add a line to my todo')
      complete.mockReset()
      respondsWith(editsNote())

      await engine.processUtterance('add a line here then')

      expect(editor.content).toBe('hi\n# Budget\n\nbody')
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

    it('names the opened path in the steps, so a single match is visible after the fact', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo(), addsItem())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(steps).toContain(`Opened: ${TODO}`)
    })

    // The resolve is recorded like a pick, so open_note's holds check passes and
    // a later edit in the same turn asks nothing.
    it('edits the opened note twice without asking again, since the resolve is consent', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo(), addsItem(), addsItem())

      await engineOf().processUtterance('add toilet paper twice')

      expect(todoEditor.content).toBe(
        '# Todo\n\n- [ ] milk\n- [ ] toilet paper\n- [ ] toilet paper\n',
      )
    })

    it('asks nothing when a single candidate opens in auto mode', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo(), addsItem())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(asked).toEqual([])
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
        `Refused open_note: ${TODO} was not chosen by the user this turn; call choose_note with it now, then open it. Do not ask the user in prose`,
      )
    })

    it('reports a refusal when a path was never offered, so a stuck turn says why', async () => {
      respondsWith(opensTodo())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(steps.at(-1)).toContain('Refused open_note:')
    })

    it('names the note in the step when an edit lands', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo(), addsItem())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(steps.at(-1)).toBe(`Edit: applied — ${TODO}`)
    })

    // The model's result names the operation and the note, which the step
    // already carries the path for: reusing it would name the note twice.
    it('keeps the step short where the model reads the longer result', async () => {
      respondsWith(findsTodo(), offersTodo(), opensTodo(), addsItem())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(steps.at(-1)).not.toContain('insert_text')
    })
  })
})
