import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { App, TFile } from 'obsidian'
import { EditEngine } from '../edit-engine'
import { NoteEditor } from '../note-editor'
import { WorkspaceNoteLocator } from '../workspace-note-locator'
import { AgentSession } from '../models/agent-session'
import { Outcomes } from '../../shared/models/outcome'
import { ChatProvider, ChatMessage } from '../../providers/types'
import { SkillRepository } from '../../skills/skill-repository'
import { AgentsMdChain } from '../../agents/agents-md-chain'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { FakeEditor } from '../../test-support/fake-editor'
import { aTextTurn, anOpenNote } from '../../test-support/builders'

const NOTE = 'Journal/2026/today.md'

describe('EditEngine', () => {
  let editor: FakeEditor
  let adapter: FakeAdapter
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let noteLocator: WorkspaceNoteLocator
  let reported: AgentsMdChain[]

  beforeEach(() => {
    vi.clearAllMocks()
    editor = new FakeEditor('# Today\n\nbody')
    adapter = new FakeAdapter()
    complete = vi.fn().mockResolvedValue(Outcomes.success(aTextTurn('ok')))
    noteLocator = new WorkspaceNoteLocator({} as App, {} as TFile)
    reported = []
  })

  const engineFor = (notePath: string) => {
    vi.spyOn(noteLocator, 'locate').mockImplementation(() =>
      Outcomes.success(anOpenNote(editor, notePath)),
    )
    return new EditEngine(
      { complete },
      new AgentSession({ path: notePath, basename: 'today' } as TFile),
      new SkillRepository(adapter.asAdapter(), ''),
      noteLocator,
      new AgentsMdRepository(adapter.asAdapter()),
      new NoteEditor(),
      (chain) => reported.push(chain),
    )
  }

  const systemPrompt = (call = 0) => (complete.mock.calls[call][0] as ChatMessage[])[0].content

  describe('when the target folder holds instructions', () => {
    beforeEach(() => {
      adapter.withFile('Journal/AGENTS.md', 'Write in second person.')
    })

    it('puts the instructions in the system prompt when a turn runs', async () => {
      await engineFor(NOTE).processUtterance('add a line')

      expect(systemPrompt()).toContain('Write in second person.')
    })

    it('reports the resolved chain when a turn runs', async () => {
      await engineFor(NOTE).processUtterance('add a line')

      expect(reported[0].files.map((file) => file.folder)).toEqual(['Journal'])
    })
  })

  describe('when the target sits in another folder', () => {
    it('resolves the new folder chain when the engine is rebound', async () => {
      adapter
        .withFile('Journal/AGENTS.md', 'Write in second person.')
        .withFile('Clients/AGENTS.md', 'Never abbreviate a name.')

      await engineFor('Clients/acme.md').processUtterance('add a line')

      expect(systemPrompt()).toContain('Never abbreviate a name.')
    })

    it('leaves out the other folder instructions when the engine is rebound', async () => {
      adapter
        .withFile('Journal/AGENTS.md', 'Write in second person.')
        .withFile('Clients/AGENTS.md', 'Never abbreviate a name.')

      await engineFor('Clients/acme.md').processUtterance('add a line')

      expect(systemPrompt()).not.toContain('Write in second person.')
    })
  })

  describe('when no folder holds instructions', () => {
    it('omits the instructions section when the vault holds no file', async () => {
      await engineFor(NOTE).processUtterance('add a line')

      expect(systemPrompt()).not.toContain('standing instructions below')
    })

    it('reports an empty chain when the vault holds no file', async () => {
      await engineFor(NOTE).processUtterance('add a line')

      expect(reported[0].isEmpty()).toBe(true)
    })
  })
})
