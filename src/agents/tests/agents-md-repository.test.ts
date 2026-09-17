import { beforeEach, describe, expect, it } from 'vitest'
import { AgentsMdRepository } from '../agents-md-repository'
import { FakeVault } from '../../test-support/fake-vault'

const NOTE = 'Projects/Acme/meeting.md'

describe('AgentsMdRepository', () => {
  let vault: FakeVault
  let repository: AgentsMdRepository

  beforeEach(() => {
    vault = new FakeVault()
    repository = new AgentsMdRepository(vault.asVault())
  })

  const folders = async (notePath = NOTE) =>
    (await repository.resolveFor(notePath)).files.map((file) => file.folder)

  describe('when no folder holds an instruction file', () => {
    it('resolves an empty chain when the vault holds neither filename', async () => {
      const chain = await repository.resolveFor(NOTE)

      expect(chain.isEmpty()).toBe(true)
    })
  })

  describe('when only the vault root holds a file', () => {
    it('resolves the root file alone when no folder below has one', async () => {
      vault.withNote('AGENTS.md', 'Use full names.')

      expect(await folders()).toEqual([''])
    })
  })

  describe('when several folders hold a file', () => {
    beforeEach(() => {
      vault
        .withNote('AGENTS.md', 'Use full names.')
        .withNote('Projects/AGENTS.md', 'Lead with the outcome.')
        .withNote('Projects/Acme/AGENTS.md', 'Never abbreviate the client.')
    })

    it('orders the chain root first when every level has a file', async () => {
      expect(await folders()).toEqual(['', 'Projects', 'Projects/Acme'])
    })

    it('carries each file contents when every level has a file', async () => {
      const chain = await repository.resolveFor(NOTE)

      expect(chain.files.map((file) => file.contents)).toEqual([
        'Use full names.',
        'Lead with the outcome.',
        'Never abbreviate the client.',
      ])
    })
  })

  describe('when a folder mid-chain has no file', () => {
    it('keeps the readable folders when a level between them has none', async () => {
      vault.withNote('AGENTS.md', 'Use full names.').withNote('Projects/Acme/AGENTS.md', 'Local.')

      expect(await folders()).toEqual(['', 'Projects/Acme'])
    })
  })

  describe('when the chain exceeds the cap', () => {
    beforeEach(() => {
      vault
        .withNote('AGENTS.md', 'x'.repeat(30_000))
        .withNote('Projects/Acme/AGENTS.md', 'y'.repeat(30_000))
    })

    it('keeps the nearest folder when the cap cannot hold the whole chain', async () => {
      expect(await folders()).toEqual(['Projects/Acme'])
    })

    it('reports the furthest folder as dropped when the cap fires', async () => {
      const chain = await repository.resolveFor(NOTE)

      expect(chain.dropped.map((file) => file.folder)).toEqual([''])
    })
  })
})
