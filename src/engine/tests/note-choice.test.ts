import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NoteChoice } from '../note-choice'
import { ChoiceRequest } from '../models/choice-request'
import { ChosenNotes } from '../models/chosen-notes'
import { TurnCancellation } from '../turn-cancellation'

const TODO = 'Journal/Weekly/Week-36/todo.md'
const SHOPPING = 'Lists/shopping.md'
const BOTH = [TODO, SHOPPING]
const offering = (candidates: readonly string[] = BOTH) =>
  new ChoiceRequest(candidates, 'add an item')

describe('NoteChoice', () => {
  let offered: (readonly string[])[]

  beforeEach(() => {
    vi.clearAllMocks()
    offered = []
  })

  // Picks the named path when it is offered, so a test states which note the
  // user pointed at rather than wiring a choice per case.
  const picking = (pick: string | null) => (request: ChoiceRequest) => {
    offered = [...offered, request.candidates]
    return Promise.resolve(request.candidates.includes(pick ?? '') ? pick : null)
  }

  describe('when the user picks a candidate', () => {
    let choice: NoteChoice

    beforeEach(() => {
      choice = NoteChoice.of(picking(TODO))
    })

    it('returns the path the user picked when they pick one', async () => {
      expect(await choice.choose(offering())).toBe(TODO)
    })

    it('names every candidate in the question when a shortlist is offered', async () => {
      await choice.choose(offering())

      expect(offered).toEqual([BOTH])
    })

    it('holds a path the user picked, so a later open needs no question', async () => {
      await choice.choose(offering())

      expect(choice.holds(TODO)).toBe(true)
    })

    it('holds no path never offered, so one pick does not license another note', async () => {
      await choice.choose(offering())

      expect(choice.holds('Lists/other.md')).toBe(false)
    })

    it('asks again for a second, different note, so one pick is about one note', async () => {
      await choice.choose(offering())

      await choice.choose(offering(['Lists/other.md']))

      expect(offered).toEqual([BOTH, ['Lists/other.md']])
    })

    it('asks once for a note already picked this turn', async () => {
      await choice.choose(offering())

      expect(choice.holds(TODO)).toBe(true)
    })
  })

  describe('when the user declines every candidate', () => {
    let choice: NoteChoice

    beforeEach(() => {
      choice = NoteChoice.of(picking(null))
    })

    it('returns null when the user declines every candidate', async () => {
      expect(await choice.choose(offering())).toBeNull()
    })

    it('holds no path when the user declined, so nothing opens on a decline', async () => {
      await choice.choose(offering())

      expect(choice.holds(TODO)).toBe(false)
    })
  })

  describe('when the panel answers with a path never offered', () => {
    it('declines a path outside the shortlist, so a pick licenses only a candidate', async () => {
      const choice = NoteChoice.of(() => Promise.resolve('Lists/invented.md'))

      expect(await choice.choose(offering())).toBeNull()
    })

    it('holds a path outside the shortlist nowhere, so nothing opens on it', async () => {
      const choice = NoteChoice.of(() => Promise.resolve('Lists/invented.md'))

      await choice.choose(offering())

      expect(choice.holds('Lists/invented.md')).toBe(false)
    })
  })

  describe('when the mode is automatic', () => {
    let choice: NoteChoice

    beforeEach(() => {
      choice = NoteChoice.automatic()
    })

    it('returns the first candidate without asking when constructed automatic', async () => {
      expect(await choice.choose(offering())).toBe(TODO)
    })

    it('holds the first candidate when constructed automatic, so auto mode opens it', async () => {
      await choice.choose(offering())

      expect(choice.holds(TODO)).toBe(true)
    })

    it('holds no other candidate when constructed automatic, so auto mode opens one note', async () => {
      await choice.choose(offering())

      expect(choice.holds(SHOPPING)).toBe(false)
    })
  })

  describe('when the turn is cancelled rather than answered', () => {
    let cancellation: TurnCancellation
    let choice: NoteChoice

    beforeEach(() => {
      cancellation = new TurnCancellation()
      choice = NoteChoice.of(() => new Promise(() => undefined), cancellation)
    })

    it('declines when the turn is cancelled rather than answered', async () => {
      const chosen = choice.choose(offering())
      cancellation.cancel()

      expect(await chosen).toBeNull()
    })

    it('settles rather than parking the loop when the turn is cancelled', async () => {
      const chosen = choice.choose(offering())
      cancellation.cancel()
      await chosen

      expect(choice.holds(TODO)).toBe(false)
    })
  })

  describe('when the turn supplies its own chosen notes', () => {
    it('records the pick in the turn-scoped set, so the dispatcher reads it', async () => {
      const chosen = new ChosenNotes()

      await NoteChoice.of(picking(TODO), new TurnCancellation(), chosen).choose(offering())

      expect(chosen.includes(TODO)).toBe(true)
    })
  })
})
