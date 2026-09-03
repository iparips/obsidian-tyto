import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { App } from 'obsidian'
import { SessionRepository } from '../../session/session-repository'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { HarnessTools } from '../harness-tools'
import { OpenApproval } from '../open-approval'
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
    buildApproval: () => OpenApproval = () => OpenApproval.granted(),
    answer = '',
  ) =>
    anEngine(
      { complete },
      {
        sessions,
        noteLocator,
        agentsMdRepository: new AgentsMdRepository(new FakeAdapter().asAdapter()),
        harnessTools: harnessOf(),
        openApproval: buildApproval,
        userQuestion: () =>
          UserQuestion.of((request) => {
            questions.push(request)
            return Promise.resolve(answer)
          }),
        progress: new TurnProgressPublisher(
          () => undefined,
          () => undefined,
          (path) => retargets.push(path),
          () => undefined,
          () => undefined,
          () => undefined,
          (step) => steps.push(`${step.label}: ${step.detail}`),
        ),
      },
    )

  const answering = (answer: boolean) => () =>
    OpenApproval.of((path) => {
      asked.push(path)
      return Promise.resolve(answer)
    })

  const respondsWith = (...turns: ReturnType<typeof aToolTurn>[]) => {
    turns.forEach((turn) => complete.mockResolvedValueOnce(Outcomes.success(turn)))
    complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))
  }

  // A glob rather than a search: this helper exists to put a path in SeenPaths
  // so open_note will accept it, and a glob does that as well as a search did.
  const findsTodo = () =>
    aToolTurn(aToolCall('glob_notes', { pattern: 'Journal/Weekly/Week-36/*.md' }))

  const opensTodo = () => aToolTurn(aToolCall('open_note', { path: TODO }))

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

  describe('when the open is approved', () => {
    it('opens a model-chosen note and edits it when the approval grants', async () => {
      respondsWith(findsTodo(), opensTodo(), addsItem())

      await engineOf(answering(true)).processUtterance('add toilet paper to my todo')

      expect(todoEditor.content).toBe('# Todo\n\n- [ ] milk\n- [ ] toilet paper\n')
    })

    it('moves the target note when the approval grants', async () => {
      respondsWith(findsTodo(), opensTodo())

      await engineOf(answering(true)).processUtterance('open my todo')

      expect(sessions.targetNote()).toBe(TODO)
    })

    it('publishes the retarget when the approval grants, so the header follows', async () => {
      respondsWith(findsTodo(), opensTodo())

      await engineOf(answering(true)).processUtterance('open my todo')

      expect(retargets).toEqual([TODO])
    })

    it('names the note it was asked about when an open is approved', async () => {
      respondsWith(findsTodo(), opensTodo())

      await engineOf(answering(true)).processUtterance('open my todo')

      expect(asked).toEqual([TODO])
    })

    it('asks once across a two-step instruction, so the edit after the open does not ask again', async () => {
      respondsWith(findsTodo(), opensTodo(), addsItem())

      await engineOf(answering(true)).processUtterance('open my todo and add visit doctor')

      expect(asked).toEqual([TODO])
    })
  })

  describe('when the open is declined', () => {
    it('leaves the target note unchanged when the approval declines', async () => {
      respondsWith(findsTodo(), opensTodo())

      await engineOf(answering(false)).processUtterance('add toilet paper to my todo')

      expect(sessions.targetNote()).toBe('note.md')
    })

    it('writes to no note when the approval declines', async () => {
      respondsWith(findsTodo(), opensTodo(), addsItem())

      await engineOf(answering(false)).processUtterance('add toilet paper to my todo')

      expect(todoEditor.content).toBe('# Todo\n\n- [ ] milk\n')
    })

    it('leaves the starting note untouched when the approval declines', async () => {
      respondsWith(findsTodo(), opensTodo())

      await engineOf(answering(false)).processUtterance('add toilet paper to my todo')

      expect(editor.content).toBe('# Budget\n\nbody')
    })

    it('publishes no retarget when the approval declines', async () => {
      respondsWith(findsTodo(), opensTodo())

      await engineOf(answering(false)).processUtterance('add toilet paper to my todo')

      expect(retargets).toEqual([])
    })

    it('returns a declined result rather than throwing when the approval declines', async () => {
      respondsWith(findsTodo(), opensTodo())

      await engineOf(answering(false)).processUtterance('add toilet paper to my todo')

      expect(toolResultsOf(2)[1]).toMatchObject({
        content: 'the user declined that note; the session did not move and nothing was written',
      })
    })

    it('ends the turn with a summary when the approval declines', async () => {
      respondsWith(findsTodo(), opensTodo())

      const outcome = await engineOf(answering(false)).processUtterance('add toilet paper')

      expect(outcome.succeeded()).toBe(true)
    })
  })

  describe('when the budget forbids the open', () => {
    it('asks for no approval when the path was never offered by a search', async () => {
      respondsWith(opensTodo())

      await engineOf(answering(true)).processUtterance('add toilet paper to my todo')

      expect(asked).toEqual([])
    })

    it('refuses the open when the path was never offered by a search', async () => {
      respondsWith(opensTodo())

      await engineOf(answering(true)).processUtterance('add toilet paper to my todo')

      expect(sessions.targetNote()).toBe('note.md')
    })
  })

  describe('when auto mode grants without asking', () => {
    it('opens a model-chosen note and edits it, end to end, in auto mode', async () => {
      respondsWith(findsTodo(), opensTodo(), addsItem())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(todoEditor.content).toBe('# Todo\n\n- [ ] milk\n- [ ] toilet paper\n')
    })

    it('refuses an unseen path in auto mode, so a refusal holds in both modes', async () => {
      respondsWith(opensTodo())

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

    it('refuses a fifth question when the question cap is reached', async () => {
      respondsWith(asksWhich(), asksWhich(), asksWhich(), asksWhich(), asksWhich())

      await engineOf(undefined, 'a').processUtterance('add milk to my list')

      expect(toolResultsOf(5).at(-1)).toMatchObject({
        content:
          'this turn has already asked 4 questions; act on what you have or say what stopped you',
      })
    })

    it('asks nothing past the cap when the question cap is reached', async () => {
      respondsWith(asksWhich(), asksWhich(), asksWhich(), asksWhich(), asksWhich())

      await engineOf(undefined, 'a').processUtterance('add milk to my list')

      expect(questions).toHaveLength(4)
    })
  })

  describe('when the panel asks what the turn did', () => {
    it('reports a glob with its pattern and note count', async () => {
      respondsWith(findsTodo())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(steps).toEqual(['Globbed: Journal/Weekly/Week-36/*.md — 1 note'])
    })

    it('reports the open when a model-chosen note opens', async () => {
      respondsWith(findsTodo(), opensTodo())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(steps.at(-1)).toBe(`Opened: ${TODO}`)
    })

    it('reports a refusal when a path was never offered, so a stuck turn says why', async () => {
      respondsWith(opensTodo())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(steps.at(-1)).toContain('Refused:')
    })

    it('reports the edit when one lands', async () => {
      respondsWith(findsTodo(), opensTodo(), addsItem())

      await engineOf().processUtterance('add toilet paper to my todo')

      expect(steps.at(-1)).toBe('Edited: applied')
    })
  })
})
