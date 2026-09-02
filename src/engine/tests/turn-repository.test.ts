import { beforeEach, describe, expect, it } from 'vitest'
import { TurnRepository } from '../turn-repository'
import { AgentsMdChain } from '../../agents/agents-md-chain'
import { AgentsMdFile } from '../../agents/agents-md-file'
import { OpenNote } from '../models/open-note'
import { ResolvedNote } from '../models/resolved-note'
import { FakeEditor } from '../../test-support/fake-editor'

const aResolvedNote = (path: string, chain = new AgentsMdChain()): ResolvedNote => {
  const editor = new FakeEditor('# Note\n\nbody')
  return new ResolvedNote(new OpenNote(editor.asEditor(), path, editor.getCursor()), chain)
}

describe('TurnRepository', () => {
  let turn: TurnRepository

  beforeEach(() => {
    turn = new TurnRepository(aResolvedNote('note.md'))
  })

  describe('when the turn opens', () => {
    it('holds the note it was opened on', () => {
      expect(turn.targetNote().path).toBe('note.md')
    })

    it('has no edit position before any edit lands', () => {
      expect(turn.editEnd()).toBeNull()
    })

    it('starts with an unspent budget', () => {
      expect(turn.budget.takeCommand()).toBe(true)
    })
  })

  describe('when a command moves the target', () => {
    const chain = new AgentsMdChain([new AgentsMdFile('Journal', 'AGENTS.md', 'Be brief.')])

    it('holds the new note when the target moves', () => {
      turn.retargetTo(aResolvedNote('Journal/day.md', chain))

      expect(turn.targetNote().path).toBe('Journal/day.md')
    })

    it('holds the new folder chain when the target moves', () => {
      turn.retargetTo(aResolvedNote('Journal/day.md', chain))

      expect(turn.agentMdChain()).toBe(chain)
    })
  })

  describe('when edits land', () => {
    it('keeps the position when an edit reports one', () => {
      turn.recordEdit({ line: 2, ch: 4 })

      expect(turn.editEnd()).toEqual({ line: 2, ch: 4 })
    })

    it('keeps the last position when a later call changes nothing', () => {
      turn.recordEdit({ line: 2, ch: 4 })

      turn.recordEdit(undefined)

      expect(turn.editEnd()).toEqual({ line: 2, ch: 4 })
    })
  })
})
