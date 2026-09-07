import { describe, expect, it } from 'vitest'
import { ObsidianCommandMatch } from '../models/obsidian-command-match'
import { AllowedObsidianCommand } from '../models/allowed-obsidian-command'

describe('ObsidianCommandMatch', () => {
  const matchOf = (coveredBy: string | null) =>
    new ObsidianCommandMatch(new AllowedObsidianCommand('daily-notes', 'Open today'), coveredBy)

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
