import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from 'obsidian'
import { EngineFactory } from '../engine-factory'
import { PluginScope } from '../plugin-scope'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { FakeWorkspace } from '../../test-support/fake-workspace'
import { DEFAULT_SETTINGS } from '../../settings/settings'
import { ChatMessage } from '../../model/providers/models/chat-message'
import { LeafPresence, SessionPanelPropsBuilder } from '../session-panel-props-builder'
import { SessionFileStore } from '../../session/session-file-store'
import { SessionPanelProps } from '../../session/views/SessionPanel'
import { PanelEntry } from '../../session/models/panel-state'
import {
  SESSION_SNAPSHOT_VERSION,
  StoredMessages,
  SessionSnapshot,
} from '../../session/models/session-snapshot'

const PLUGIN_FOLDER = 'plugins/tyto'
const SESSION_PATH = `${PLUGIN_FOLDER}/session.json`

const leaf: LeafPresence = {
  isVisible: () => false,
  reveal: () => undefined,
}

// The two the panel supplies itself, which these tests read the props of rather
// than fire.
const startNewSession = () => undefined
const onObsidianBackgrounded = () => () => undefined

const aSnapshot = (overrides: Partial<SessionSnapshot> = {}): SessionSnapshot => ({
  version: SESSION_SNAPSHOT_VERSION,
  targetPath: 'Journal/day.md',
  messages: [StoredMessages.of(ChatMessage.user('add a heading'))],
  entries: [{ kind: 'user', text: 'add a heading' }],
  ...overrides,
})

describe('SessionPanelPropsBuilder', () => {
  let builder: SessionPanelPropsBuilder
  let adapter: FakeAdapter

  // The workspace decides every binding now, so each test says what the user has
  // open rather than what it hands the builder.
  const builderWith = (openPath: string | null): SessionPanelPropsBuilder => {
    const app = {
      vault: { adapter: adapter.asAdapter() },
      workspace: new FakeWorkspace(openPath).asWorkspace(),
    } as App
    const scope = new PluginScope(app, () => DEFAULT_SETTINGS)
    return new SessionPanelPropsBuilder(
      DEFAULT_SETTINGS,
      new EngineFactory(scope),
      vi.fn(),
      scope.activeNote(),
      new SessionFileStore(adapter.asAdapter(), PLUGIN_FOLDER),
    )
  }

  beforeEach(() => {
    adapter = new FakeAdapter()
    builder = builderWith('Journal/day.md')
  })

  // The record as the store holds it, which is the only way to read one now
  // that the recorder assembles it.
  const recordAndRead = async (
    props: SessionPanelProps,
    entries: readonly PanelEntry[],
  ): Promise<SessionSnapshot> => {
    props.recordHistory?.(entries)
    await vi.waitFor(() => expect(adapter.contentsOf(SESSION_PATH)).toBeDefined())
    return JSON.parse(adapter.contentsOf(SESSION_PATH) ?? 'null') as SessionSnapshot
  }

  describe('when a session is built fresh', () => {
    it('binds to the note the user has open', () => {
      const props = builder.buildFromLeafPresence(leaf, startNewSession, onObsidianBackgrounded)

      expect(props.notePath).toBe('Journal/day.md')
    })

    it('names the note from the open path, so the panel header says where the turn lands', () => {
      const props = builder.buildFromLeafPresence(leaf, startNewSession, onObsidianBackgrounded)

      expect(props.noteName).toBe('day')
    })

    it('stays unbound when nothing markdown is open', () => {
      const props = builderWith(null).buildFromLeafPresence(
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      expect(props.noteName).toBeNull()
      expect(props.notePath).toBeNull()
    })

    it('stays unbound when a canvas is in front, since no editor can show one', () => {
      const props = builderWith('Boards/plan.canvas').buildFromLeafPresence(
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      expect(props.notePath).toBeNull()
    })

    it('holds no entries when the session is built rather than restored', () => {
      const props = builder.buildFromLeafPresence(leaf, startNewSession, onObsidianBackgrounded)

      expect(props.entries).toEqual([])
    })
  })

  describe('when the panel records its history', () => {
    it('writes the record to the store, so a closed panel leaves what it showed', async () => {
      const props = builder.buildFromLeafPresence(leaf, startNewSession, onObsidianBackgrounded)

      const stored = await recordAndRead(props, [{ kind: 'user', text: 'add a heading' }])

      expect(stored.entries).toEqual([{ kind: 'user', text: 'add a heading' }])
      expect(stored.targetPath).toBe('Journal/day.md')
    })
  })

  describe('when a session is restored from a record', () => {
    it('binds to the open note when it is the one the record names', () => {
      const props = builder.buildFromSessionSnapshot(
        aSnapshot(),
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      expect(props.notePath).toBe('Journal/day.md')
    })

    it('names the note from the open path, since a workspace answer holds no basename', () => {
      const props = builder.buildFromSessionSnapshot(
        aSnapshot(),
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      expect(props.noteName).toBe('day')
    })

    it('binds to the note now open rather than the one the record remembers', () => {
      const props = builderWith('Lists/shopping.md').buildFromSessionSnapshot(
        aSnapshot(),
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      expect(props.notePath).toBe('Lists/shopping.md')
    })

    it('stays unbound when nothing markdown is open, whatever the record names', () => {
      const props = builderWith(null).buildFromSessionSnapshot(
        aSnapshot(),
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      expect(props.noteName).toBeNull()
      expect(props.notePath).toBeNull()
    })

    it('keeps the restored entries when it binds somewhere other than the stored note', () => {
      const props = builderWith('Lists/shopping.md').buildFromSessionSnapshot(
        aSnapshot(),
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      expect(props.entries).toEqual([
        { kind: 'user', text: 'add a heading' },
        { kind: 'restored', text: 'Session restored.' },
      ])
    })

    it('keeps the restored history when it binds somewhere other than the stored note', () => {
      const props = builderWith('Lists/shopping.md').buildFromSessionSnapshot(
        aSnapshot(),
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      const source = props.transcriptOf?.([])

      expect(source?.chatHistory.map((message) => message.content)).toEqual(['add a heading'])
    })

    it('restores the stored entries into the panel, saying where the session came back', () => {
      const props = builder.buildFromSessionSnapshot(
        aSnapshot(),
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      expect(props.entries).toEqual([
        { kind: 'user', text: 'add a heading' },
        { kind: 'restored', text: 'Session restored.' },
      ])
    })

    it('stamps the restored line when the record says it was written', () => {
      const stored = { ...aSnapshot(), writtenAt: new Date(2026, 8, 11, 14, 32).getTime() }

      const props = builder.buildFromSessionSnapshot(
        stored,
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      const line = props.entries?.at(-1)
      expect(line?.kind).toBe('restored')
      expect(line && 'text' in line ? line.text : '').toContain(
        'Session restored from 2026-09-11 14:32 ',
      )
    })

    it('leaves the restored line unstamped when the record was written before the field existed', () => {
      const props = builder.buildFromSessionSnapshot(
        aSnapshot(),
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      expect(props.entries?.at(-1)).toEqual({ kind: 'restored', text: 'Session restored.' })
    })

    it('leaves the restored line unstamped when the stored time is not a number', () => {
      const stored = { ...aSnapshot(), writtenAt: 'quarter past' as unknown as number }

      const props = builder.buildFromSessionSnapshot(
        stored,
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      expect(props.entries?.at(-1)).toEqual({ kind: 'restored', text: 'Session restored.' })
    })

    it('drops the restored line from the next record, so a second restore adds one not two', async () => {
      const props = builder.buildFromSessionSnapshot(
        aSnapshot(),
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      const stored = await recordAndRead(props, props.entries ?? [])

      expect(stored.entries).toEqual([{ kind: 'user', text: 'add a heading' }])
    })

    it('hands the transcript the restored history, which is what its first step must start past', () => {
      const props = builder.buildFromSessionSnapshot(
        aSnapshot(),
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      const source = props.transcriptOf?.([])

      expect(source?.chatHistory.map((message) => message.content)).toEqual(['add a heading'])
    })

    it('records no step from before the restore, so a copied transcript holds only the turns since', () => {
      const props = builder.buildFromSessionSnapshot(
        aSnapshot(),
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      expect(props.transcriptOf?.([])?.steps).toEqual([])
    })

    it('restores the chat history so the next record carries it back', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 8, 11, 14, 32))
      const props = builder.buildFromSessionSnapshot(
        aSnapshot(),
        leaf,
        startNewSession,
        onObsidianBackgrounded,
      )

      const stored = await recordAndRead(props, [])

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
