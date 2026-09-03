import { beforeEach, describe, expect, it } from 'vitest'
import { TargetNoteResolver } from '../target-note-resolver'
import { TurnProgressPublisher } from '../turn-progress-publisher'
import { AgentsMdRepository } from '../../agents/agents-md-repository'
import { SessionRepository } from '../../session/session-repository'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { FakeEditor } from '../../test-support/fake-editor'
import { FakeNoteLocator } from '../../test-support/fake-note-locator'
import { aSession } from '../../test-support/builders'

describe('TargetNoteResolver', () => {
  let noteLocator: FakeNoteLocator
  let adapter: FakeAdapter

  beforeEach(() => {
    noteLocator = new FakeNoteLocator().withOpenNote('note.md', new FakeEditor('# Budget\n\nbody'))
    adapter = new FakeAdapter()
  })

  const resolverFor = (sessions: SessionRepository): TargetNoteResolver =>
    new TargetNoteResolver(
      sessions,
      noteLocator,
      new AgentsMdRepository(adapter.asAdapter()),
      TurnProgressPublisher.silent(),
    )

  describe('when the session is unbound', () => {
    it('yields no note when no note is open', async () => {
      const resolved = await resolverFor(new SessionRepository(null)).resolve()

      expect(resolved.value).toBeNull()
    })

    it('succeeds rather than failing when no note is open', async () => {
      const resolved = await resolverFor(new SessionRepository(null)).resolve()

      expect(resolved.hasFailed()).toBe(false)
    })

    it('reads no instruction file when no note is open', async () => {
      await resolverFor(new SessionRepository(null)).resolve()

      expect(adapter.reads).toEqual([])
    })
  })

  describe('when the session is bound', () => {
    it('yields the note it is bound to', async () => {
      const resolved = await resolverFor(aSession()).resolve()

      expect(resolved.value?.note.path).toBe('note.md')
    })

    it('fails when the bound note is not open in an editor', async () => {
      const resolved = await resolverFor(aSession('closed.md')).resolve()

      expect(resolved.message).toBe('closed.md is not open in an editor')
    })
  })
})
