import { beforeEach, describe, expect, it } from 'vitest'
import { TFile } from 'obsidian'
import { SessionRepository } from '../session-repository'
import { ChatMessage } from '../../providers/types'

describe('SessionRepository', () => {
  let sessions: SessionRepository

  beforeEach(() => {
    sessions = new SessionRepository({ path: 'note.md', basename: 'note' } as TFile)
  })

  describe('when the session starts', () => {
    it('targets the note it was opened on', () => {
      expect(sessions.targetNote()).toBe('note.md')
    })

    it('holds no conversation before an utterance', () => {
      expect(sessions.chatHistory()).toEqual([])
    })
  })

  describe('when a command moves the target', () => {
    beforeEach(() => {
      sessions.changeTargetNote('Journal/day.md')
    })

    it('targets the new note when the target changes', () => {
      expect(sessions.targetNote()).toBe('Journal/day.md')
    })
  })

  describe('when the conversation grows', () => {
    it('keeps messages in the order they were appended', () => {
      sessions.appendChatMessage(ChatMessage.user('first'))
      sessions.appendChatMessage(ChatMessage.model('second'))

      expect(sessions.chatHistory().map((message) => message.content)).toEqual(['first', 'second'])
    })
  })
})
