import { describe, expect, it } from 'vitest'
import { SpokenToolCall } from '../spoken-tool-call'

describe('SpokenToolCall', () => {
  describe('when the reply is a call written as text', () => {
    // The shape a provider actually produced: two calls run together with no
    // prose around them, published to the user as the turn's answer.
    it('reads as spoken when two calls run together', () => {
      const reply =
        'grep_notes{"pattern": "Mornington", "applicable_skills": []}grep_notes{"pattern": "walk", "applicable_skills": []}'

      expect(SpokenToolCall.inReply(reply).wasSpoken()).toBe(true)
    })

    it('reads as spoken when one call stands alone', () => {
      expect(SpokenToolCall.inReply('grep_notes{"pattern": "walk"}').wasSpoken()).toBe(true)
    })

    it('reads as spoken when a space separates the name from its arguments', () => {
      expect(SpokenToolCall.inReply('glob_notes {"pattern": "**/*.md"}').wasSpoken()).toBe(true)
    })

    it('names each tool it found, so the correction says what to emit', () => {
      const reply = 'grep_notes{"pattern": "a"}glob_notes{"pattern": "b"}'

      expect(SpokenToolCall.inReply(reply).message()).toContain('grep_notes and glob_notes')
    })

    it('names a repeated tool once rather than per call', () => {
      const reply = 'grep_notes{"pattern": "a"}grep_notes{"pattern": "b"}'

      expect(SpokenToolCall.inReply(reply).message()).toContain('grep_notes written as text')
    })
  })

  describe('when the reply is prose that mentions a tool', () => {
    it('reads as prose when the call syntax is a fraction of a sentence', () => {
      const reply =
        'I searched with grep_notes{"pattern": "walk"} and found nothing, so there is no note covering that walk anywhere in the vault.'

      expect(SpokenToolCall.inReply(reply).wasSpoken()).toBe(false)
    })

    it('reads as prose when a tool is named with no arguments at all', () => {
      expect(SpokenToolCall.inReply('I will use grep_notes next').wasSpoken()).toBe(false)
    })
  })

  describe('when the reply names no tool', () => {
    it('reads as prose for an ordinary answer', () => {
      expect(SpokenToolCall.inReply('Nothing in the vault covers that').wasSpoken()).toBe(false)
    })

    it('reads as prose for an empty reply, which another ending owns', () => {
      expect(SpokenToolCall.inReply('   ').wasSpoken()).toBe(false)
    })

    // A brace-carrying answer is not a call: the name in front of it is what
    // makes one, so JSON the user asked about stays prose.
    it('reads as prose for a JSON object no tool name precedes', () => {
      expect(SpokenToolCall.inReply('{"pattern": "walk"}').wasSpoken()).toBe(false)
    })
  })
})
