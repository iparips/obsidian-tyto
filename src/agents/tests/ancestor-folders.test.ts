import { describe, expect, it } from 'vitest'
import { AncestorFolders } from '../ancestor-folders'

describe('AncestorFolders', () => {
  describe('when the note sits at the vault root', () => {
    it('yields the vault root alone when the path has no folder', () => {
      const folders = AncestorFolders.of('note.md')

      expect(folders).toEqual([''])
    })
  })

  describe('when the note sits below the vault root', () => {
    it('yields the root then each ancestor when the path is nested', () => {
      const folders = AncestorFolders.of('Projects/Acme/Notes/meeting.md')

      expect(folders).toEqual(['', 'Projects', 'Projects/Acme', 'Projects/Acme/Notes'])
    })

    it('keeps the spaces when a folder name contains them', () => {
      const folders = AncestorFolders.of('0 - Meta/Daily Notes/today.md')

      expect(folders).toEqual(['', '0 - Meta', '0 - Meta/Daily Notes'])
    })
  })
})
