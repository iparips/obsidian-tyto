import { beforeEach, describe, expect, it } from 'vitest'
import { TargetNoteResolver } from '../note-binding/target-note-resolver'
import { NoNoteBound, ResolutionFailed, TargetResolved } from '../note-binding/target-resolution'
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
    it('says no note is bound when no note is open', async () => {
      const resolution = await resolverFor(new SessionRepository(null)).resolve()

      expect(resolution).toBeInstanceOf(NoNoteBound)
    })

    it('yields no note to write to when no note is open', async () => {
      const resolution = await resolverFor(new SessionRepository(null)).resolve()

      expect(resolution.noteOrNull()).toBeNull()
    })

    it('reads no instruction file when no note is open', async () => {
      await resolverFor(new SessionRepository(null)).resolve()

      expect(adapter.reads).toEqual([])
    })
  })

  describe('when the session is bound', () => {
    it('resolves the target when an editor is showing it', async () => {
      const resolution = await resolverFor(aSession()).resolve()

      expect(resolution).toBeInstanceOf(TargetResolved)
    })

    it('yields the note it is bound to', async () => {
      const resolution = await resolverFor(aSession()).resolve()

      expect(resolution.noteOrNull()?.note.path).toBe('note.md')
    })
  })

  describe('when the bound note is not open in an editor', () => {
    it('fails to resolve when no editor is showing the note', async () => {
      const resolution = await resolverFor(aSession('closed.md')).resolve()

      expect(resolution).toBeInstanceOf(ResolutionFailed)
    })

    it('names the note it could not reach, so the turn can say which one', async () => {
      const resolution = await resolverFor(aSession('closed.md')).resolve()

      expect(resolution instanceof ResolutionFailed && resolution.path).toBe('closed.md')
    })

    it('carries the reason it could not reach the note', async () => {
      const resolution = await resolverFor(aSession('closed.md')).resolve()

      expect(resolution instanceof ResolutionFailed && resolution.reason).toBe(
        'closed.md is not open in an editor',
      )
    })

    it('yields no note to write to when the note cannot be reached', async () => {
      const resolution = await resolverFor(aSession('closed.md')).resolve()

      expect(resolution.noteOrNull()).toBeNull()
    })
  })
})
