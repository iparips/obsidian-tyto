import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { App } from 'obsidian'
import { SessionRepository } from '../../session/session-repository'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { HarnessTools } from '../harness-tools'
import { Outcomes } from '../../shared/models/outcome'
import { ChatMessage, ChatProvider } from '../../providers/types'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { AllowList } from '../../commands/allow-list'
import { CommandCatalogue } from '../../commands/command-catalogue'
import { CommandRegistry } from '../../commands/command-registry'
import { CommandRunner } from '../../commands/command-runner'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { SkillRepository } from '../../skills/skill-repository'
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
import { aTextTurn, aToolCall, aToolTurn, anEngine } from '../../test-support/builders'

const DAILY = 'Journal/2026-09-02.md'
const SKILLS_PATH = '0 - Meta/Skills'

describe('EditEngine', () => {
  let dailyEditor: FakeEditor
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let registry: FakeCommandRegistry
  let workspace: FakeWorkspace
  let vault: FakeVault
  let adapter: FakeAdapter
  let noteLocator: FakeNoteLocator
  let sessions: SessionRepository
  let skills: string[]
  let answers: { text: string; sources: string[] }[]
  let retargets: string[]

  beforeEach(() => {
    vi.clearAllMocks()
    dailyEditor = new FakeEditor('# Today\n\n## Meetings\n')
    complete = vi.fn()
    registry = new FakeCommandRegistry().withCommand('daily-notes:goto-today', 'Open today')
    workspace = new FakeWorkspace(null)
    vault = new FakeVault()
    adapter = new FakeAdapter()
    skills = []
    answers = []
    retargets = []
    sessions = new SessionRepository(null)
    noteLocator = new FakeNoteLocator().withOpenNote(DAILY, dailyEditor)
  })

  const opensDailyNote = () => {
    registry.executeCommandById = (id: string) => {
      registry.executed.push(id)
      workspace.finishesOpening(DAILY)
      return true
    }
  }

  const appOf = (): App =>
    ({ ...registry.asApp(), workspace: workspace.asWorkspace() }) as unknown as App

  const harnessOf = (): HarnessTools => {
    const app = appOf()
    const commandRegistry = new CommandRegistry(app)
    const catalogue = new CommandCatalogue(commandRegistry, new AllowList(['daily-notes:*']))
    return new HarnessTools(
      new CommandRunner(app, catalogue, new OpenedNoteWait(app, 30), commandRegistry),
      new NoteReader(vault.asVault()),
      catalogue,
      true,
      new SearchTools(new NoteGlob(vault.asVault()), new NoteGrep(vault.asVault())),
    )
  }

  const engineOf = () =>
    anEngine(
      { complete },
      {
        sessions,
        noteLocator,
        agentsMdRepository: new AgentsMdRepository(adapter.asAdapter()),
        skillRepository: new SkillRepository(adapter.asAdapter(), SKILLS_PATH),
        harnessTools: harnessOf(),
        progress: new TurnProgressPublisher(
          (text, sources) => answers.push({ text, sources }),
          (path) => retargets.push(path),
          () => undefined,
          (name) => skills.push(name),
        ),
      },
    )

  const respondsWith = (...turns: ReturnType<typeof aToolTurn>[]) => {
    turns.forEach((turn) => complete.mockResolvedValueOnce(Outcomes.success(turn)))
    complete.mockResolvedValue(Outcomes.success(aTextTurn('done')))
  }

  const toolResults = (call: number) =>
    complete.mock.calls[call][0].filter((message: ChatMessage) => message.isToolResult())

  describe('when the session is unbound', () => {
    it('opens the turn when no note is open', async () => {
      respondsWith()

      const outcome = await engineOf().processUtterance('what is in my vault')

      expect(outcome.hasFailed()).toBe(false)
    })

    it('tells the model no note is open when no note is open', async () => {
      respondsWith()

      await engineOf().processUtterance('what is in my vault')

      expect(complete.mock.calls[0][0].at(-1).content).toContain('No note is open')
    })

    it('tells the model to open the note by command when one is allowed', async () => {
      respondsWith()

      await engineOf().processUtterance('what is in my vault')

      expect(complete.mock.calls[0][0].at(-1).content).toContain(
        'run the command that opens the note they named',
      )
    })

    it('offers the edit tools when no note is open', async () => {
      respondsWith()

      await engineOf().processUtterance('what is in my vault')

      expect(complete.mock.calls[0][1].map((schema) => schema.name)).toContain('insert_at')
    })

    it('answers from a listing when no note is open', async () => {
      vault.withNote('Quotes/roofing.md', 'the roofing quote came to 12k')
      respondsWith(
        aToolTurn(aToolCall('glob_notes', { pattern: 'Quotes/*.md' })),
        aToolTurn(
          aToolCall('answer_from_search', {
            answer: 'It was 12k.',
            sources: ['Quotes/roofing.md'],
          }),
        ),
      )

      await engineOf().processUtterance('what did I write about the roofing quote')

      expect(answers).toEqual([{ text: 'It was 12k.', sources: ['Quotes/roofing.md'] }])
    })

    it('reads a note when no note is open', async () => {
      vault.withNote('Quotes/roofing.md', 'the roofing quote came to 12k')
      respondsWith(aToolTurn(aToolCall('read_note', { path: 'Quotes/roofing.md' })))

      await engineOf().processUtterance('read the roofing note')

      expect(toolResults(1)[0]).toMatchObject({ content: 'the roofing quote came to 12k' })
    })

    it('loads a skill when no note is open', async () => {
      adapter.withSkill(
        `${SKILLS_PATH}/tidy-notes`,
        '---\nname: tidy-notes\ndescription: Tidies a note.\n---\n\nTidy it.',
      )
      respondsWith(aToolTurn(aToolCall('load_skill', { name: 'tidy-notes' })))

      await engineOf().processUtterance('tidy my notes')

      expect(skills).toEqual(['tidy-notes'])
    })
  })

  describe('when an unbound session is asked for an edit', () => {
    beforeEach(() => {
      respondsWith(aToolTurn(aToolCall('insert_at', { location: 'note_end', content: 'x' })))
    })

    it('tells the model no note is open when an edit is asked for', async () => {
      await engineOf().processUtterance('add a line')

      expect(toolResults(1)[0]).toMatchObject({
        content: 'no note is open; tell the user to open one before editing',
      })
    })

    it('writes to no note when an edit is asked for', async () => {
      await engineOf().processUtterance('add a line')

      expect(dailyEditor.content).toBe('# Today\n\n## Meetings\n')
    })
  })

  describe('when a command opens a note in an unbound session', () => {
    beforeEach(() => {
      opensDailyNote()
    })

    it('binds the session to the note the command opened', async () => {
      respondsWith(aToolTurn(aToolCall('run_command', { command_id: 'daily-notes:goto-today' })))

      await engineOf().processUtterance('open my daily note')

      expect(sessions.targetNote()).toBe(DAILY)
    })

    it('applies the following edit to the opened note when a command binds', async () => {
      respondsWith(
        aToolTurn(aToolCall('run_command', { command_id: 'daily-notes:goto-today' })),
        aToolTurn(
          aToolCall('insert_text', {
            anchor_text: '## Meetings',
            position: 'after',
            content: '\nstandup notes',
          }),
        ),
      )

      await engineOf().processUtterance('open my daily note and add a paragraph')

      expect(dailyEditor.content).toBe('# Today\n\n## Meetings\nstandup notes\n')
    })
  })

  describe('when the user opens a note mid-session', () => {
    it('binds the session to the note the user opened', async () => {
      const engine = engineOf()

      engine.followActiveNote(DAILY)

      expect(sessions.targetNote()).toBe(DAILY)
    })

    it('names the opened note to the panel when the user opens one', async () => {
      const engine = engineOf()

      engine.followActiveNote(DAILY)

      expect(retargets).toEqual([DAILY])
    })

    it('edits the opened note when the user opens one mid-session', async () => {
      const engine = engineOf()
      engine.followActiveNote(DAILY)
      respondsWith(aToolTurn(aToolCall('insert_at', { location: 'note_end', content: 'x' })))

      await engine.processUtterance('add a line')

      expect(dailyEditor.content).toBe('# Today\n\n## Meetings\nx')
    })
  })
})
