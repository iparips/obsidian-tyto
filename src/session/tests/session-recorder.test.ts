import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { ChatMessage } from '../../model/providers/models/chat-message'
import { SessionRecorder } from '../session-recorder'
import { SessionRepository } from '../session-repository'
import { SessionStore } from '../session-store'

const PLUGIN_FOLDER = '.obsidian/plugins/tyto'
const SESSION_PATH = `${PLUGIN_FOLDER}/session.json`

describe('SessionRecorder', () => {
  let adapter: FakeAdapter
  let recorder: SessionRecorder

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 11, 14, 32))
    adapter = new FakeAdapter()
    const sessions = SessionRepository.restored('Journal/day.md', [
      ChatMessage.user('add a heading'),
    ])
    recorder = new SessionRecorder(sessions, new SessionStore(adapter.asAdapter(), PLUGIN_FOLDER))
  })

  describe('when the history is recorded', () => {
    it('writes the entries beside the history the model reads back', async () => {
      recorder.record([
        { kind: 'user', text: 'add a heading' },
        { kind: 'assistant', text: 'made the edit' },
      ])

      await vi.runAllTimersAsync()

      expect(JSON.parse(adapter.contentsOf(SESSION_PATH) ?? 'null')).toEqual({
        version: 1,
        targetPath: 'Journal/day.md',
        messages: [{ role: 'user', content: 'add a heading', toolCalls: [], toolCallId: '' }],
        entries: [
          { kind: 'user', text: 'add a heading' },
          { kind: 'assistant', text: 'made the edit' },
        ],
        writtenAt: new Date(2026, 8, 11, 14, 32).getTime(),
      })
    })
  })
})
