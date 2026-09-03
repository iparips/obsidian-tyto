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

    it('reports itself bound when it was opened on a note', () => {
      expect(sessions.isBound()).toBe(true)
    })
  })

  describe('when the session starts with no note open', () => {
    beforeEach(() => {
      sessions = new SessionRepository(null)
    })

    it('reports itself unbound when it was opened on no note', () => {
      expect(sessions.isBound()).toBe(false)
    })

    it('targets no note when unbound', () => {
      expect(sessions.targetNote()).toBeNull()
    })

    it('keeps its conversation when unbound', () => {
      sessions.appendChatMessage(ChatMessage.user('what is in my vault'))

      expect(sessions.chatHistory().map((message) => message.content)).toEqual([
        'what is in my vault',
      ])
    })

    it('binds to the note when the target changes', () => {
      sessions.changeTargetNote('Journal/day.md')

      expect(sessions.isBound()).toBe(true)
    })

    it('targets the opened note when the target changes', () => {
      sessions.changeTargetNote('Journal/day.md')

      expect(sessions.targetNote()).toBe('Journal/day.md')
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
