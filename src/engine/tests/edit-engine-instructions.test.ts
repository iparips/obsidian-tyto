import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { Outcomes } from '../../shared/models/outcome'
import { ChatProvider } from '../../model/providers/types'
import { AgentsMdChain } from '../../agents/agents-md-chain'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { FakeVault } from '../../test-support/fake-vault'
import { FakeEditor } from '../../test-support/fake-editor'
import { aSession, aTextTurn, anEngine } from '../../test-support/builders'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { SessionRepository } from '../../session/session-repository'

const NOTE = 'Journal/2026/today.md'

describe('EditEngine', () => {
  let editor: FakeEditor
  let vault: FakeVault
  let complete: Mock<Parameters<ChatProvider['complete']>, ReturnType<ChatProvider['complete']>>
  let reported: AgentsMdChain[]

  beforeEach(() => {
    vi.clearAllMocks()
    editor = new FakeEditor('# Today\n\nbody')
    vault = new FakeVault()
    complete = vi.fn().mockResolvedValue(Outcomes.success(aTextTurn('ok')))
    reported = []
  })

  const engineFor = (notePath: string) =>
    anEngine(
      { complete },
      {
        sessions: aSession(notePath),
        noteLocator: new FakeNoteLocator().withOpenNote(notePath, editor),
        agentsMdRepository: new AgentsMdRepository(vault.asVault()),
        progress: new TurnProgressPublisher(
          () => undefined,
          () => undefined,
          (chain: AgentsMdChain) => reported.push(chain),
          () => undefined,
        ),
      },
    )

  const systemPrompt = (call = 0) => complete.mock.calls[call][0][0].content

  // No note, so nothing to walk up from: the root file is the whole chain.
  const anUnboundEngine = () =>
    anEngine(
      { complete },
      {
        sessions: new SessionRepository(null),
        noteLocator: new FakeNoteLocator(),
        agentsMdRepository: new AgentsMdRepository(vault.asVault()),
        progress: new TurnProgressPublisher(
          () => undefined,
          () => undefined,
          (chain: AgentsMdChain) => reported.push(chain),
          () => undefined,
        ),
      },
    )

  describe('when the target folder holds instructions', () => {
    beforeEach(() => {
      vault.withNote('Journal/AGENTS.md', 'Write in second person.')
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
      vault
        .withNote('Journal/AGENTS.md', 'Write in second person.')
        .withNote('Clients/AGENTS.md', 'Never abbreviate a name.')

      await engineFor('Clients/acme.md').processUtterance('add a line')

      expect(systemPrompt()).toContain('Never abbreviate a name.')
    })

    it('leaves out the other folder instructions when the engine is rebound', async () => {
      vault
        .withNote('Journal/AGENTS.md', 'Write in second person.')
        .withNote('Clients/AGENTS.md', 'Never abbreviate a name.')

      await engineFor('Clients/acme.md').processUtterance('add a line')

      expect(systemPrompt()).not.toContain('Write in second person.')
    })
  })

  // A search turn runs unbound, and it is the one that most needs the vault's
  // layout: without it the model hunts for a folder scheme the root file states.
  describe('when the session is bound to no note', () => {
    it('puts the vault root instructions in the system prompt', async () => {
      vault.withNote('CLAUDE.md', 'Journal entries live under Weekly.')

      await anUnboundEngine().processUtterance('where did I walk')

      expect(systemPrompt()).toContain('Journal entries live under Weekly.')
    })

    it('reports the root chain, so the panel says the instructions loaded', async () => {
      vault.withNote('CLAUDE.md', 'Journal entries live under Weekly.')

      await anUnboundEngine().processUtterance('where did I walk')

      expect(reported[0].files.map((file) => file.folder)).toEqual([''])
    })

    it('leaves a folder instruction out, since no note names the folder', async () => {
      vault
        .withNote('CLAUDE.md', 'Journal entries live under Weekly.')
        .withNote('Clients/AGENTS.md', 'Never abbreviate a name.')

      await anUnboundEngine().processUtterance('where did I walk')

      expect(systemPrompt()).not.toContain('Never abbreviate a name.')
    })

    it('omits the section when the vault root holds no file', async () => {
      await anUnboundEngine().processUtterance('where did I walk')

      expect(systemPrompt()).not.toContain('standing instructions below')
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
