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

  const fileNames = async (notePath = NOTE) =>
    (await repository.resolveFor(notePath)).files.map((file) => file.fileName)

  describe('when a folder holds only one of the two filenames', () => {
    it('reads AGENTS.md when the folder holds only that', async () => {
      vault.withNote('Projects/AGENTS.md', 'Lead with the outcome.')

      expect(await fileNames()).toEqual(['AGENTS.md'])
    })

    it('falls back to CLAUDE.md when the folder holds only that', async () => {
      vault.withNote('Projects/CLAUDE.md', 'Lead with the outcome.')

      expect(await fileNames()).toEqual(['CLAUDE.md'])
    })
  })

  describe('when a folder holds both filenames', () => {
    beforeEach(() => {
      vault
        .withNote('Projects/AGENTS.md', 'Lead with the outcome.')
        .withNote('Projects/CLAUDE.md', 'Lead with the outcome.')
    })

    it('takes AGENTS.md alone when the folder holds both', async () => {
      expect(await fileNames()).toEqual(['AGENTS.md'])
    })

    it('never reads the CLAUDE.md when the folder holds both', async () => {
      await repository.resolveFor(NOTE)

      expect(vault.reads).not.toContain('Projects/CLAUDE.md')
    })
  })

  describe('when the chain mixes the two filenames', () => {
    it('takes each folder own filename when the chain mixes them', async () => {
      vault
        .withNote('AGENTS.md', 'Use full names.')
        .withNote('Projects/Acme/CLAUDE.md', 'Never abbreviate the client.')

      expect(await fileNames()).toEqual(['AGENTS.md', 'CLAUDE.md'])
    })
  })

  describe('when a file holds nothing to read', () => {
    it('contributes no section when the file holds only whitespace', async () => {
      vault.withNote('Projects/AGENTS.md', '   \n\n  ')

      expect(await fileNames()).toEqual([])
    })

    it('suppresses the CLAUDE.md when the folder AGENTS.md is empty', async () => {
      vault.withNote('Projects/AGENTS.md', '').withNote('Projects/CLAUDE.md', 'Lead with it.')

      expect(await fileNames()).toEqual([])
    })
  })

  describe('when a chain has already been resolved', () => {
    beforeEach(async () => {
      vault.withNote('Projects/Acme/AGENTS.md', 'Never abbreviate the client.')
      await repository.resolveFor(NOTE)
      vault.reads.length = 0
    })

    it('reads nothing when a second target sits in the same folder', async () => {
      await repository.resolveFor('Projects/Acme/other.md')

      expect(vault.reads).toEqual([])
    })

    it('reads again when the target sits in a sibling folder', async () => {
      vault.withNote('Projects/Beta/AGENTS.md', 'Keep the brief short.')

      await repository.resolveFor('Projects/Beta/other.md')

      expect(vault.reads).toContain('Projects/Beta/AGENTS.md')
    })
  })
})
