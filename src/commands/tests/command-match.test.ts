import { describe, expect, it } from 'vitest'
import { CommandMatch } from '../models/command-match'
import { AllowedCommand } from '../models/allowed-command'

describe('CommandMatch', () => {
  const matchOf = (coveredBy: string | null) =>
    new CommandMatch(new AllowedCommand('daily-notes', 'Open today'), coveredBy)

  describe('when an entry covers the command', () => {
    it('reports itself covered when an entry covers it', () => {
      expect(matchOf('daily-notes').isCovered()).toBe(true)
    })
  })

  describe('when no entry covers the command', () => {
    it('reports itself uncovered when no entry covers it', () => {
      expect(matchOf(null).isCovered()).toBe(false)
    })
  })
})
