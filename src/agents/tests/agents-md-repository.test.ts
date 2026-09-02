import { beforeEach, describe, expect, it } from 'vitest'
import { AgentsMdRepository } from '../agents-md-repository'
import { FakeAdapter } from '../../test-support/fake-adapter'

const NOTE = 'Projects/Acme/meeting.md'

describe('AgentsMdRepository', () => {
  let adapter: FakeAdapter
  let repository: AgentsMdRepository

  beforeEach(() => {
    adapter = new FakeAdapter()
    repository = new AgentsMdRepository(adapter.asAdapter())
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
      adapter.withFile('AGENTS.md', 'Use full names.')

      expect(await folders()).toEqual([''])
    })
  })

  describe('when several folders hold a file', () => {
    beforeEach(() => {
      adapter
        .withFile('AGENTS.md', 'Use full names.')
        .withFile('Projects/AGENTS.md', 'Lead with the outcome.')
        .withFile('Projects/Acme/AGENTS.md', 'Never abbreviate the client.')
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
      adapter.withFile('AGENTS.md', 'Use full names.').withFile('Projects/Acme/AGENTS.md', 'Local.')

      expect(await folders()).toEqual(['', 'Projects/Acme'])
    })
  })

  describe('when the chain exceeds the cap', () => {
    beforeEach(() => {
      adapter
        .withFile('AGENTS.md', 'x'.repeat(30_000))
        .withFile('Projects/Acme/AGENTS.md', 'y'.repeat(30_000))
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
