import { describe, expect, it } from 'vitest'
import { ChatMessage } from '../../model/providers/models/chat-message'
import { ToolCall } from '../../model/providers/models/tool-call'
import { PanelEntry } from '../models/panel-state'
import {
  SESSION_SNAPSHOT_VERSION,
  StoredMessages,
  SessionSnapshot,
} from '../models/session-snapshot'

// Through JSON, because the record's only job is surviving a file boundary: a
// field the writer sets and the reader ignores is invisible until then.
const roundTripped = (session: SessionSnapshot): SessionSnapshot =>
  JSON.parse(JSON.stringify(session)) as SessionSnapshot

describe('SessionSnapshot', () => {
  describe('when a session is written and read back', () => {
    it('keeps every field when the session is bound', () => {
      const session: SessionSnapshot = {
        version: SESSION_SNAPSHOT_VERSION,
        targetPath: 'Journal/day.md',
        messages: [StoredMessages.of(ChatMessage.user('add a heading'))],
        entries: [{ kind: 'user', text: 'add a heading' }],
      }

      expect(roundTripped(session)).toEqual({
        version: SESSION_SNAPSHOT_VERSION,
        targetPath: 'Journal/day.md',
        messages: [{ role: 'user', content: 'add a heading', toolCalls: [], toolCallId: '' }],
        entries: [{ kind: 'user', text: 'add a heading' }],
      })
    })

    it('keeps the null target when the session is unbound', () => {
      const session: SessionSnapshot = {
        version: SESSION_SNAPSHOT_VERSION,
        targetPath: null,
        messages: [],
        entries: [],
      }

      expect(roundTripped(session).targetPath).toBeNull()
    })
  })

  describe('when a message is mapped', () => {
    it('keeps the tool calls when the model asked for some', () => {
      const call = new ToolCall('call-1', 'read_note', { path: 'day.md' })

      expect(StoredMessages.of(ChatMessage.modelToolCalls([call]))).toEqual({
        role: 'assistant',
        content: '',
        toolCalls: [{ id: 'call-1', name: 'read_note', args: { path: 'day.md' } }],
        toolCallId: '',
      })
    })

    it('keeps the call id when the message is a tool result', () => {
      expect(StoredMessages.of(ChatMessage.toolCallResult('call-1', 'the note'))).toEqual({
        role: 'tool',
        content: 'the note',
        toolCalls: [],
        toolCallId: 'call-1',
      })
    })
  })

  describe('when a message is rebuilt', () => {
    it('rebuilds a tool result through toolCallResult when the role is tool', () => {
      const stored = StoredMessages.of(ChatMessage.toolCallResult('call-1', 'the note'))

      const message = StoredMessages.toMessage(roundTripped(sessionHolding(stored)).messages[0])

      expect(message.isToolResult()).toBe(true)
      expect(message.toolCallId).toBe('call-1')
    })

    it('rebuilds the tool calls when the role is assistant and calls were made', () => {
      const call = new ToolCall('call-1', 'read_note', { path: 'day.md' })
      const stored = StoredMessages.of(ChatMessage.modelToolCalls([call]))

      const message = StoredMessages.toMessage(roundTripped(sessionHolding(stored)).messages[0])

      expect(message.hasToolCalls()).toBe(true)
      expect(message.toolCalls).toEqual([new ToolCall('call-1', 'read_note', { path: 'day.md' })])
    })

    it('rebuilds a plain reply when the role is assistant and no calls were made', () => {
      const message = StoredMessages.toMessage(StoredMessages.of(ChatMessage.model('done')))

      expect(message.hasToolCalls()).toBe(false)
      expect(message.content).toBe('done')
    })

    it('rebuilds an instruction when the role is user', () => {
      const message = StoredMessages.toMessage(StoredMessages.of(ChatMessage.user('add one')))

      expect(message.isUser()).toBe(true)
    })

    it('rebuilds a system message when the role is system', () => {
      const message = StoredMessages.toMessage(StoredMessages.of(ChatMessage.system('rules')))

      expect(message.isSystem()).toBe(true)
    })
  })

  describe('when the panel entries are written and read back', () => {
    it('keeps all twelve kinds when the panel held one of each', () => {
      const entries: PanelEntry[] = [
        { kind: 'user', text: 'add a heading' },
        { kind: 'assistant', text: 'added it' },
        { kind: 'error', step: 'chat', text: 'the provider failed' },
        { kind: 'instructions', text: 'loaded the journal skill' },
        { kind: 'warning', text: 'the note moved' },
        { kind: 'progress', lines: [{ label: 'read_note', detail: 'day.md', refused: false }] },
        { kind: 'answer', text: 'three notes', sources: ['day.md'] },
        { kind: 'cancelled', text: 'Stopped. Nothing was changed.' },
        { kind: 'choice', candidates: ['a.md', 'b.md'], pending: true, text: 'which note' },
        { kind: 'question', pending: true, suggestions: ['yes'], text: 'go ahead?' },
        { kind: 'restored', text: 'Session restored.' },
        { kind: 'retargeted', text: 'Now editing todo.' },
      ]

      expect(roundTripped(sessionHoldingEntries(entries)).entries).toEqual(entries)
    })
  })
})

const sessionHolding = (message: ReturnType<typeof StoredMessages.of>): SessionSnapshot => ({
  version: SESSION_SNAPSHOT_VERSION,
  targetPath: null,
  messages: [message],
  entries: [],
})

const sessionHoldingEntries = (entries: PanelEntry[]): SessionSnapshot => ({
  version: SESSION_SNAPSHOT_VERSION,
  targetPath: null,
  messages: [],
  entries,
})
