import { describe, expect, it } from 'vitest'
import { SkillsInSessionChecker } from '../skills-in-session-checker'
import { Skill } from '../../../skills/skill'

const JOURNAL = new Skill('journal', 'Writes the daily note.', 'Skills/journal.md')
const SHOPPING = new Skill('shopping', 'Keeps the list.', 'Skills/shopping.md')

const checkerHaving = (namesRead: readonly string[] = []) =>
  new SkillsInSessionChecker([JOURNAL, SHOPPING], namesRead)

describe('SkillsInSessionChecker', () => {
  describe('when checking the names against the vault', () => {
    it('returns nothing when every name is defined', () => {
      expect(checkerHaving().getNamesNotDefinedByVault(['journal', 'shopping'])).toEqual([])
    })

    it('returns the name no vault skill carries', () => {
      expect(checkerHaving().getNamesNotDefinedByVault(['gardening'])).toEqual(['gardening'])
    })

    it('returns only the undefined name when the others are defined', () => {
      expect(checkerHaving().getNamesNotDefinedByVault(['journal', 'gardening'])).toEqual([
        'gardening',
      ])
    })

    it('returns nothing for an empty declaration, which names nothing to check', () => {
      expect(checkerHaving().getNamesNotDefinedByVault([])).toEqual([])
    })
  })

  describe('when checking the names against the session', () => {
    it('returns nothing when the session has read the name', () => {
      expect(checkerHaving(['journal']).getNamesNotReadThisSession(['journal'])).toEqual([])
    })

    it('returns the name nothing has read', () => {
      expect(checkerHaving().getNamesNotReadThisSession(['journal'])).toEqual(['journal'])
    })

    // Reading one skill does not license another: the gate asks which skill, not
    // whether any was read.
    it('returns the unread name even when a different one was read', () => {
      expect(checkerHaving(['journal']).getNamesNotReadThisSession(['shopping'])).toEqual([
        'shopping',
      ])
    })

    it('returns every unread name when several are declared', () => {
      expect(checkerHaving().getNamesNotReadThisSession(['journal', 'shopping'])).toEqual([
        'journal',
        'shopping',
      ])
    })

    it('returns only the unread one when the others are read', () => {
      expect(
        checkerHaving(['journal']).getNamesNotReadThisSession(['journal', 'shopping']),
      ).toEqual(['shopping'])
    })
  })

  describe('when naming what the vault defines', () => {
    it('names every skill, so a refusal can list them', () => {
      expect(checkerHaving().getVaultSkillNames()).toEqual(['journal', 'shopping'])
    })
  })
})
