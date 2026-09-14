import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NOTICES } from '../../test-support/__mocks__/obsidian'
import { TurnAskersService } from '../turn-askers-service'
import { TurnNotices } from '../turn-notices'
import { ChoiceRequest } from '../../engine/waiting/choice-request'
import { NotesChosenByUserRepository } from '../../engine/turn/notes-chosen-by-user-repository'
import { TurnCancellationController } from '../../engine/turn/turn-cancellation-controller'
import { OpenMode } from '../../settings/settings'

const TODO = 'Journal/Weekly/Week-36/todo.md'
const SHOPPING = 'Lists/shopping.md'

describe('TurnAskersService', () => {
  let offered: (readonly string[])[]

  beforeEach(() => {
    vi.clearAllMocks()
    NOTICES.length = 0
    offered = []
  })

  // The panel is what answers, so a test subscribes in its place and records
  // what reached it.
  const askersOf = (mode: OpenMode, pick: string | null = null) => {
    const askers = new TurnAskersService(
      new TurnNotices(
        () => true,
        () => undefined,
      ),
      mode,
    )
    askers.choices.subscribe((request) => {
      offered = [...offered, request.candidates]
      return Promise.resolve(request.candidates.includes(pick ?? '') ? pick : null)
    })
    return askers
  }

  const choosing = (mode: OpenMode, candidates: readonly string[], pick: string | null = null) =>
    askersOf(mode, pick)
      .noteChoiceService(new TurnCancellationController(), new NotesChosenByUserRepository())
      .choose(new ChoiceRequest(candidates, 'add an item'))

  describe('when the mode is auto', () => {
    it('opens the only candidate without asking when the search found one', async () => {
      expect(await choosing('auto', [TODO])).toBe(TODO)
    })

    it('asks nobody when the search found exactly one', async () => {
      await choosing('auto', [TODO])

      expect(offered).toEqual([])
    })

    // Taking the first of several was a decision made on the user's behalf, and
    // it is the half of the mode this spec removes.
    it('asks the user when the search found several', async () => {
      await choosing('auto', [TODO, SHOPPING], TODO)

      expect(offered).toEqual([[TODO, SHOPPING]])
    })

    it('returns the path the user picked from several', async () => {
      expect(await choosing('auto', [TODO, SHOPPING], TODO)).toBe(TODO)
    })

    it('returns null when the user declines every candidate', async () => {
      expect(await choosing('auto', [TODO, SHOPPING])).toBeNull()
    })
  })

  // Unchanged: a user who wants to see every open before it happens still has
  // this mode, and it is the default.
  describe('when the mode is confirm', () => {
    it('asks about a single candidate rather than opening it', async () => {
      await choosing('confirm', [TODO], TODO)

      expect(offered).toEqual([[TODO]])
    })

    it('returns the candidate once the user confirms it', async () => {
      expect(await choosing('confirm', [TODO], TODO)).toBe(TODO)
    })

    it('returns null when the user declines the single candidate', async () => {
      expect(await choosing('confirm', [TODO])).toBeNull()
    })
  })
})
