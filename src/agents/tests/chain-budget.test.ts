import { describe, expect, it } from 'vitest'
import { AgentsMdFile } from '../agents-md-file'
import { ChainBudget } from '../chain-budget'

const aFile = (folder: string, size: number) =>
  new AgentsMdFile(folder, 'AGENTS.md', 'x'.repeat(size))

describe('ChainBudget', () => {
  describe('when the chain fits the cap', () => {
    it('keeps every file in root-first order when the chain is small', () => {
      const chain = ChainBudget.apply([aFile('', 10), aFile('Journal', 10)])

      expect(chain.files.map((file) => file.folder)).toEqual(['', 'Journal'])
    })

    it('reports no drops when the chain is small', () => {
      const chain = ChainBudget.apply([aFile('', 10)])

      expect(chain.dropped).toEqual([])
    })
  })

  describe('when the chain exceeds the cap', () => {
    const overCap = [aFile('', 30_000), aFile('Journal', 30_000)]

    it('keeps the nearest folder when the cap cannot hold both', () => {
      const chain = ChainBudget.apply(overCap)

      expect(chain.files.map((file) => file.folder)).toEqual(['Journal'])
    })

    it('reports the furthest folder as dropped when the cap cannot hold both', () => {
      const chain = ChainBudget.apply(overCap)

      expect(chain.dropped.map((file) => file.folder)).toEqual([''])
    })
  })
})
