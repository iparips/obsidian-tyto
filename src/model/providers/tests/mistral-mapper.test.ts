import { describe, expect, it } from 'vitest'
import { MistralMapper } from '../mistral-mapper'
import { ChatMessage } from '../models/chat-message'
import { ToolCall } from '../models/tool-call'

describe('MistralMapper', () => {
  describe('when naming the uploaded audio file', () => {
    it('names the file with the mp4 extension when the mime type is audio/mp4', () => {
      expect(MistralMapper.fileNameFor('audio/mp4')).toBe('utterance.mp4')
    })

    it('names the file with the webm extension when the mime type is audio/webm', () => {
      expect(MistralMapper.fileNameFor('audio/webm')).toBe('utterance.webm')
    })

    it('strips codec parameters when the mime type carries them', () => {
      expect(MistralMapper.fileNameFor('audio/webm;codecs=opus')).toBe('utterance.webm')
    })

    it('falls back to webm when the mime type is empty', () => {
      expect(MistralMapper.fileNameFor('')).toBe('utterance.webm')
    })
  })

  describe('when a reply carrying tool calls is read', () => {
    it('keeps the text alongside the calls, so a sentence the model spoke is not lost', () => {
      const turn = MistralMapper.toChatTurn({
        content: 'Searching for that name now.',
        tool_calls: [{ id: 'call-1', function: { name: 'grep_notes', arguments: '{"q":"jon"}' } }],
      })

      expect(turn.content).toBe('Searching for that name now.')
      expect(turn.calls).toEqual([new ToolCall('call-1', 'grep_notes', { q: 'jon' })])
    })

    it('holds the calls alone when the reply carried no text', () => {
      const turn = MistralMapper.toChatTurn({
        content: null,
        tool_calls: [{ id: 'call-1', function: { name: 'grep_notes', arguments: '{}' } }],
      })

      expect(turn.content).toBe('')
      expect(turn.calls).toEqual([new ToolCall('call-1', 'grep_notes', {})])
    })

    it('reads as tool calls rather than text, so the turn does not end on it', () => {
      const turn = MistralMapper.toChatTurn({
        content: 'Searching now.',
        tool_calls: [{ id: 'call-1', function: { name: 'grep_notes', arguments: '{}' } }],
      })

      expect(turn.isToolCalls()).toBe(true)
    })
  })

  describe('when a reply carrying no tool calls is read', () => {
    it('holds the text and no calls', () => {
      const turn = MistralMapper.toChatTurn({ content: 'Added the heading.' })

      expect(turn.isText()).toBe(true)
      expect(turn.content).toBe('Added the heading.')
      expect(turn.calls).toEqual([])
    })

    it('holds an empty text when the content is null, rather than the string null', () => {
      expect(MistralMapper.toChatTurn({ content: null }).content).toBe('')
    })

    it('holds an empty text when the reply carried neither, so the turn ends', () => {
      const turn = MistralMapper.toChatTurn({})

      expect(turn.isText()).toBe(true)
      expect(turn.content).toBe('')
    })
  })

  // The API answers content as a string or as a list of chunks, and sends
  // either one for the same request. Read as a string alone, a chunked reply
  // is discarded and the turn ends having said nothing.
  describe('when the reply carries its content in chunks', () => {
    it('reads the text out of a single chunk', () => {
      const turn = MistralMapper.toChatTurn({ content: [{ type: 'text', text: 'Added it.' }] })

      expect(turn.content).toBe('Added it.')
    })

    // One reply split up rather than several replies, so nothing joins them.
    it('joins several text chunks with nothing between them', () => {
      const turn = MistralMapper.toChatTurn({
        content: [
          { type: 'text', text: 'Added the ' },
          { type: 'text', text: 'heading.' },
        ],
      })

      expect(turn.content).toBe('Added the heading.')
    })

    it('leaves out a reference chunk, which names a source rather than saying anything', () => {
      const turn = MistralMapper.toChatTurn({
        content: [{ type: 'text', text: 'Found it.' }, { type: 'reference' }],
      })

      expect(turn.content).toBe('Found it.')
    })

    // Reasoning the user never asked for, and it nests its text under another
    // key, so reading it would put the model's working into the reply.
    it('leaves out a thinking chunk, so reasoning stays out of the reply', () => {
      const turn = MistralMapper.toChatTurn({
        content: [{ type: 'thinking' }, { type: 'text', text: 'Added it.' }],
      })

      expect(turn.content).toBe('Added it.')
    })

    // The chunk list is open: the SDK carries an unknown variant of its own, so
    // a type this has never seen must cost the reply nothing.
    it('leaves out a chunk of a kind it does not know', () => {
      const turn = MistralMapper.toChatTurn({
        content: [{ type: 'audio' }, { type: 'text', text: 'Added it.' }],
      })

      expect(turn.content).toBe('Added it.')
    })

    it('holds an empty text when no chunk carries any', () => {
      expect(MistralMapper.toChatTurn({ content: [{ type: 'reference' }] }).content).toBe('')
    })

    it('reads the text out of chunks beside tool calls, so a spoken batch keeps its words', () => {
      const turn = MistralMapper.toChatTurn({
        content: [{ type: 'text', text: 'Searching now.' }],
        tool_calls: [{ id: 'call-1', function: { name: 'grep_notes', arguments: '{}' } }],
      })

      expect(turn.isToolCalls()).toBe(true)
      expect(turn.content).toBe('Searching now.')
    })
  })

  describe('when an assistant message carrying tool calls is sent', () => {
    it('sends the content back, so the model reads its own last reply in full', () => {
      const call = new ToolCall('call-1', 'grep_notes', { q: 'jon' })

      expect(
        MistralMapper.toApiMessage(ChatMessage.modelToolCalls([call], 'Searching now.')),
      ).toEqual({
        role: 'assistant',
        content: 'Searching now.',
        tool_calls: [{ id: 'call-1', function: { name: 'grep_notes', arguments: '{"q":"jon"}' } }],
      })
    })

    it('sends an empty content when the message carried none', () => {
      const call = new ToolCall('call-1', 'grep_notes', {})

      expect(MistralMapper.toApiMessage(ChatMessage.modelToolCalls([call])).content).toBe('')
    })
  })

  describe('when a tool result message is sent', () => {
    it('sends the call id it answers, so the provider pairs it with its call', () => {
      expect(MistralMapper.toApiMessage(ChatMessage.toolCallResult('call-1', 'the note'))).toEqual({
        role: 'tool',
        tool_call_id: 'call-1',
        content: 'the note',
      })
    })
  })

  describe('when an ordinary message is sent', () => {
    it('sends its role and content unchanged', () => {
      expect(MistralMapper.toApiMessage(ChatMessage.user('add a heading'))).toEqual({
        role: 'user',
        content: 'add a heading',
      })
    })
  })
})
