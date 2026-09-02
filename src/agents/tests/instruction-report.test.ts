import { describe, expect, it } from 'vitest'
import { AgentsMdChain } from '../agents-md-chain'
import { AgentsMdFile } from '../agents-md-file'
import { InstructionReport } from '../instruction-report'

const aFile = (folder: string) => new AgentsMdFile(folder, 'AGENTS.md', 'Write in full names.')

describe('InstructionReport', () => {
  describe('when no folder holds instructions', () => {
    it('reports itself empty when the chain has no files and no drops', () => {
      const report = InstructionReport.of(new AgentsMdChain())

      expect(report.isEmpty()).toBe(true)
    })
  })

  describe('when the chain fitted the cap', () => {
    it('names every folder that applied when the chain has files', () => {
      const report = InstructionReport.of(new AgentsMdChain([aFile(''), aFile('Journal')]))

      expect(report.panelText()).toBe('Instructions applied: vault root, Journal')
    })
  })

  describe('when the cap dropped a file', () => {
    const chain = new AgentsMdChain([aFile('Journal')], [aFile('')])

    it('says how many were dropped when the panel text is built', () => {
      const report = InstructionReport.of(chain)

      expect(report.panelText()).toBe(
        'Instructions applied: Journal (1 dropped over the size limit)',
      )
    })

    it('counts the dropped files when the notice text is built', () => {
      const report = InstructionReport.of(chain)

      expect(report.noticeText()).toContain('1 instruction file(s) dropped')
    })
  })
})
