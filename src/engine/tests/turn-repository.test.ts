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
      expect(turn.targetNote()?.path).toBe('note.md')
    })

    it('has no edit position before any edit lands', () => {
      expect(turn.editEnd()).toBeNull()
    })

    it('starts with an unspent budget', () => {
      expect(turn.budget.takeCommand()).toBe(true)
    })

    it('reports itself bound when it holds a note', () => {
      expect(turn.isBound()).toBe(true)
    })
  })

  describe('when the session is unbound', () => {
    beforeEach(() => {
      turn = new TurnRepository(null)
    })

    it('reports itself unbound when it holds no note', () => {
      expect(turn.isBound()).toBe(false)
    })

    it('holds no note when the session is unbound', () => {
      expect(turn.targetNote()).toBeNull()
    })

    it('holds an empty folder chain when the session is unbound', () => {
      expect(turn.agentMdChain().isEmpty()).toBe(true)
    })
  })

  describe('when a command moves the target', () => {
    const chain = new AgentsMdChain([new AgentsMdFile('Journal', 'AGENTS.md', 'Be brief.')])

    it('holds the new note when the target moves', () => {
      turn.retargetTo(aResolvedNote('Journal/day.md', chain))

      expect(turn.targetNote()?.path).toBe('Journal/day.md')
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

  describe('when naming what the turn wrote', () => {
    it('holds no written note before any edit lands', () => {
      expect(turn.writtenNotes()).toEqual([])
    })

    it('holds no written note when a call changed nothing', () => {
      turn.recordEdit(undefined)

      expect(turn.writtenNotes()).toEqual([])
    })

    it('holds the note when an edit lands', () => {
      turn.recordEdit({ line: 2, ch: 4 })

      expect(turn.writtenNotes()).toEqual(['note.md'])
    })

    it('holds one entry when the same note is written twice', () => {
      turn.recordEdit({ line: 2, ch: 4 })

      turn.recordEdit({ line: 3, ch: 0 })

      expect(turn.writtenNotes()).toEqual(['note.md'])
    })

    it('holds both notes in order when a turn writes to two', () => {
      turn.recordEdit({ line: 2, ch: 4 })
      turn.retargetTo(aResolvedNote('Journal/day.md'))

      turn.recordEdit({ line: 1, ch: 0 })

      expect(turn.writtenNotes()).toEqual(['note.md', 'Journal/day.md'])
    })
  })
})
