import { beforeEach, describe, expect, it } from 'vitest'
import { TFile } from 'obsidian'
import { SessionRepository } from '../session-repository'
import { ChatMessage } from '../../model/providers/types'

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

  // Counted rather than held, so a restored session numbers its turns the same
  // way a live one does. The number reaches the model twice: the note context
  // names the turn it is in, and an applied edit result names the turn it was
  // made in, which is how the model tells its own current work from an edit an
  // earlier turn left behind.
  describe('when the session counts its turns', () => {
    it('is on turn one before any utterance, which is the turn about to run', () => {
      expect(sessions.currentTurnNumber()).toBe(1)
    })

    it('counts the utterance as the turn it started', () => {
      sessions.appendChatMessage(ChatMessage.user('add a line'))

      expect(sessions.currentTurnNumber()).toBe(1)
    })

    it('counts one turn per utterance rather than one per message', () => {
      sessions.appendChatMessage(ChatMessage.user('add a line'))
      sessions.appendChatMessage(ChatMessage.model('added it'))
      sessions.appendChatMessage(ChatMessage.user('now tick it off'))

      expect(sessions.currentTurnNumber()).toBe(2)
    })

    it('numbers a restored session from the utterances it was restored with', () => {
      const restored = SessionRepository.restored('note.md', [
        ChatMessage.user('add a line'),
        ChatMessage.model('added it'),
        ChatMessage.user('now tick it off'),
      ])

      expect(restored.currentTurnNumber()).toBe(2)
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
      sessions.bindTo('Journal/day.md')

      expect(sessions.isBound()).toBe(true)
    })

    it('targets the opened note when the target changes', () => {
      sessions.bindTo('Journal/day.md')

      expect(sessions.targetNote()).toBe('Journal/day.md')
    })
  })

  describe('when the target goes away', () => {
    it('reports itself unbound, so the turn is told no note is bound', () => {
      sessions.bindTo('Journal/day.md')

      sessions.bindTo(null)

      expect(sessions.isBound()).toBe(false)
    })
  })

  describe('when a command moves the target', () => {
    beforeEach(() => {
      sessions.bindTo('Journal/day.md')
    })

    it('targets the new note when the target changes', () => {
      expect(sessions.targetNote()).toBe('Journal/day.md')
    })
  })

  describe('when a session is restored from a record', () => {
    beforeEach(() => {
      sessions = SessionRepository.restored('Journal/day.md', [
        ChatMessage.user('add a heading'),
        ChatMessage.model('added it'),
      ])
    })

    it('targets the stored path when the record named one', () => {
      expect(sessions.targetNote()).toBe('Journal/day.md')
    })

    it('reports the restored messages in order, so the next turn sends them', () => {
      expect(sessions.chatHistory().map((message) => message.content)).toEqual([
        'add a heading',
        'added it',
      ])
    })

    it('reports itself unbound when the record named no target', () => {
      expect(SessionRepository.restored(null, []).isBound()).toBe(false)
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
