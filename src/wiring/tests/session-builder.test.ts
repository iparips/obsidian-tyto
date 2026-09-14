import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App, TFile } from 'obsidian'
import { EngineFactory } from '../engine-factory'
import { PluginScope } from '../plugin-scope'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { DEFAULT_SETTINGS } from '../../settings/settings'
import { ChatMessage } from '../../model/providers/models/chat-message'
import { PanelPresence, SessionBuilder } from '../session-builder'
import {
  SESSION_SNAPSHOT_VERSION,
  StoredMessages,
  SessionSnapshot,
} from '../../session/models/session-snapshot'

const presence: PanelPresence = {
  isVisible: () => false,
  reveal: () => undefined,
  onHidden: () => () => undefined,
  startNewSession: () => undefined,
}

const aSnapshot = (overrides: Partial<SessionSnapshot> = {}): SessionSnapshot => ({
  version: SESSION_SNAPSHOT_VERSION,
  targetPath: 'Journal/day.md',
  messages: [StoredMessages.of(ChatMessage.user('add a heading'))],
  entries: [{ kind: 'user', text: 'add a heading' }],
  ...overrides,
})

describe('SessionBuilder', () => {
  let builder: SessionBuilder

  beforeEach(() => {
    const adapter = new FakeAdapter()
    const scope = new PluginScope(
      { vault: { adapter: adapter.asAdapter() } } as App,
      () => DEFAULT_SETTINGS,
    )
    const engineFactory = new EngineFactory(scope)
    builder = new SessionBuilder(DEFAULT_SETTINGS, engineFactory, vi.fn())
  })

  describe('when a session is built from a file', () => {
    it('names the note from the file when a note is open', () => {
      const props = builder.build({ path: 'day.md', basename: 'day' } as TFile, presence)

      expect(props.noteName).toBe('day')
    })

    it('holds no entries when the session is built rather than restored', () => {
      const props = builder.build(null, presence)

      expect(props.entries).toEqual([])
    })
  })

  describe('when a session is restored from a record', () => {
    it('binds to the stored target when the record names one', () => {
      const props = builder.restore(aSnapshot(), presence)

      expect(props.notePath).toBe('Journal/day.md')
    })

    it('names the note from the stored path, since a record holds no basename', () => {
      const props = builder.restore(aSnapshot(), presence)

      expect(props.noteName).toBe('day')
    })

    it('stays unbound when the record holds no target', () => {
      const props = builder.restore(aSnapshot({ targetPath: null }), presence)

      expect(props.noteName).toBeNull()
      expect(props.notePath).toBeNull()
    })

    it('restores the stored entries into the panel, saying where the session came back', () => {
      const props = builder.restore(aSnapshot(), presence)

      expect(props.entries).toEqual([
        { kind: 'user', text: 'add a heading' },
        { kind: 'restored', text: 'Session restored.' },
      ])
    })

    it('stamps the restored line when the record says it was written', () => {
      const stored = { ...aSnapshot(), writtenAt: new Date(2026, 8, 11, 14, 32).getTime() }

      const props = builder.restore(stored, presence)

      const line = props.entries?.at(-1)
      expect(line?.kind).toBe('restored')
      expect(line && 'text' in line ? line.text : '').toContain(
        'Session restored from 2026-09-11 14:32 ',
      )
    })

    it('leaves the restored line unstamped when the record was written before the field existed', () => {
      const props = builder.restore(aSnapshot(), presence)

      expect(props.entries?.at(-1)).toEqual({ kind: 'restored', text: 'Session restored.' })
    })

    it('leaves the restored line unstamped when the stored time is not a number', () => {
      const stored = { ...aSnapshot(), writtenAt: 'quarter past' as unknown as number }

      const props = builder.restore(stored, presence)

      expect(props.entries?.at(-1)).toEqual({ kind: 'restored', text: 'Session restored.' })
    })

    it('drops the restored line from the next record, so a second restore adds one not two', () => {
      const props = builder.restore(aSnapshot(), presence)

      const stored = props.buildSnapshotFromEntries(props.entries ?? [])

      expect(stored?.entries).toEqual([{ kind: 'user', text: 'add a heading' }])
    })

    it('hands the transcript the restored history, which is what its first step must start past', () => {
      const props = builder.restore(aSnapshot(), presence)

      const source = props.transcriptOf?.([])

      expect(source?.chatHistory.map((message) => message.content)).toEqual(['add a heading'])
    })

    it('records no step from before the restore, so a copied transcript holds only the turns since', () => {
      const props = builder.restore(aSnapshot(), presence)

      expect(props.transcriptOf?.([])?.steps).toEqual([])
    })

    it('restores the chat history so the next record carries it back', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 8, 11, 14, 32))
      const props = builder.restore(aSnapshot(), presence)

      const stored = props.buildSnapshotFromEntries([])

      expect(stored).toEqual({
        version: 1,
        targetPath: 'Journal/day.md',
        messages: [{ role: 'user', content: 'add a heading', toolCalls: [], toolCallId: '' }],
        entries: [],
        writtenAt: new Date(2026, 8, 11, 14, 32).getTime(),
      })
      vi.useRealTimers()
    })
  })
})
