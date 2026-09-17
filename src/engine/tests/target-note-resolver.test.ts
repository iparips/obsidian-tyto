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

  // The user clicking around rebinds the session, and a tool that opened a note
  // named which one: reading the session back would hand the turn the editor
  // showing whatever the user moved to.
  describe('when the session moved after a tool named its note', () => {
    beforeEach(() => {
      noteLocator.withOpenNote('Lists/todo.md', new FakeEditor('# Todo'))
    })

    it('resolves the note it was given rather than the one now bound', async () => {
      const sessions = aSession('note.md')
      const resolution = await resolverFor(sessions).resolveFor('Lists/todo.md')

      expect(resolution.noteOrNull()?.note.path).toBe('Lists/todo.md')
    })

    // A note with no editor still resolves, so a tool that opened one binds the
    // turn to it and the write goes through the vault (D5).
    it('yields the note it was given even when it has no editor', async () => {
      const sessions = aSession('note.md')

      const resolved = await resolverFor(sessions).resolveOrNothing('Lists/gone.md')

      expect(resolved?.note.path).toBe('Lists/gone.md')
    })

    it('yields nothing when the note it was given is not a markdown note', async () => {
      const sessions = aSession('note.md')

      expect(await resolverFor(sessions).resolveOrNothing('Lists/board.canvas')).toBeNull()
    })
  })

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

  // The turn is not refused for a note with no editor: it resolves carrying a
  // null one and the write goes through the vault, which costs undo and nothing
  // else, where refusing cost the user the session (D5).
  describe('when the bound note is not open in an editor', () => {
    it('resolves rather than failing when no editor is showing the note', async () => {
      const resolution = await resolverFor(aSession('closed.md')).resolve()

      expect(resolution).toBeInstanceOf(TargetResolved)
    })

    it('yields the note it is bound to, so an edit reaches its path', async () => {
      const resolution = await resolverFor(aSession('closed.md')).resolve()

      expect(resolution.noteOrNull()?.note.path).toBe('closed.md')
    })

    it('yields it with no editor, which is what routes the write to the vault', async () => {
      const resolution = await resolverFor(aSession('closed.md')).resolve()

      expect(resolution.noteOrNull()?.note.editor).toBeNull()
    })

    // The folders are the path's, not the editor's, so the chain is collected
    // whether or not a tab is showing the note.
    it('still collects the instruction chain', async () => {
      await resolverFor(aSession('closed.md')).resolve()

      expect(adapter.reads).not.toEqual([])
    })
  })

  // Kept, and narrowed to the one case vault-writing would make worse: the
  // writer guards only on the file having a stat, which a canvas, a PDF and a
  // Bases file all satisfy, so the write would land and corrupt it (D7).
  describe('when the bound path is not a markdown note', () => {
    it('fails to resolve, since no amount of opening gains it an editor', async () => {
      const resolution = await resolverFor(aSession('board.canvas')).resolve()

      expect(resolution).toBeInstanceOf(ResolutionFailed)
    })

    it('names the path, so the turn can say which one', async () => {
      const resolution = await resolverFor(aSession('board.canvas')).resolve()

      expect(resolution instanceof ResolutionFailed && resolution.path).toBe('board.canvas')
    })

    it('carries the reset message, since that is the only way out', async () => {
      const resolution = await resolverFor(aSession('board.canvas')).resolve()

      expect(resolution instanceof ResolutionFailed && resolution.reason).toContain('press Reset')
    })

    it('yields no note to write to', async () => {
      const resolution = await resolverFor(aSession('board.canvas')).resolve()

      expect(resolution.noteOrNull()).toBeNull()
    })

    it('collects no chain, since nothing resolved to read folders from', async () => {
      await resolverFor(aSession('board.canvas')).resolve()

      expect(adapter.reads).toEqual([])
    })
  })
})
