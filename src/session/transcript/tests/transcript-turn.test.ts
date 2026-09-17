import { describe, expect, it } from 'vitest'
import { PanelItem } from '../../models/panel-state'
import { TranscriptTurn } from '../models/transcript-turn'

const aTurn = (utterance: string, target: string | null = 'Lists/todo.md'): PanelItem => ({
  kind: 'turn',
  target,
  entries: [{ kind: 'user', text: utterance }],
})

describe('TranscriptTurn', () => {
  // D6: the grouping is a fact the panel holds rather than one inferred by
  // scanning back to the last utterance.
  describe('when splitting the entries the panel holds', () => {
    it('reads one turn per turn the panel holds', () => {
      const turns = TranscriptTurn.split([aTurn('add milk'), aTurn('and eggs')])

      expect(turns.map((turn) => turn.utterance)).toEqual(['add milk', 'and eggs'])
    })

    it('numbers the turns in the order they were shown', () => {
      const turns = TranscriptTurn.split([aTurn('add milk'), aTurn('and eggs')])

      expect(turns.map((turn) => turn.index)).toEqual([0, 1])
    })

    it('leaves an entry belonging to no turn out of every turn', () => {
      const turns = TranscriptTurn.split([
        { kind: 'restored', text: 'Session restored.' },
        aTurn('add milk'),
      ])

      expect(turns).toHaveLength(1)
      expect(turns[0].entries).toEqual([{ kind: 'user', text: 'add milk' }])
    })

    it('reads no turn from a panel that holds none', () => {
      const turns = TranscriptTurn.split([{ kind: 'restored', text: 'Session restored.' }])

      expect(turns).toEqual([])
    })
  })

  describe('when reading what precedes the first turn', () => {
    it('keeps the entries shown before any turn opened', () => {
      const before = TranscriptTurn.before([
        { kind: 'restored', text: 'Session restored.' },
        aTurn('add milk'),
      ])

      expect(before).toEqual([{ kind: 'restored', text: 'Session restored.' }])
    })

    it('keeps nothing when the session opens on a turn', () => {
      expect(TranscriptTurn.before([aTurn('add milk')])).toEqual([])
    })
  })
})
