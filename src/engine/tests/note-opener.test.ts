import { beforeEach, describe, expect, it } from 'vitest'
import { App } from 'obsidian'
import { NoteOpener } from '../note-opener'
import { OpenedNoteWait } from '../../commands/opened-note-wait'
import { FakeVault } from '../../test-support/fake-vault'
import { FakeWorkspace } from '../../test-support/fake-workspace'

const TODO = 'Journal/Weekly/Week-36/todo.md'
const OTHER = 'Journal/Weekly/Week-36/other.md'

// open_note retargets the session, and retargeting resolves against an editor.
// A note the user never had on screen has none, so without this the model is
// told the note "is not open for editing" and the turn stops.
describe('NoteOpener', () => {
  let vault: FakeVault
  let workspace: FakeWorkspace

  beforeEach(() => {
    vault = new FakeVault().withNote(TODO, '- [ ] milk').withNote(OTHER, '# Other')
  })

  const openerOf = (activePath: string | null = null) => {
    workspace = new FakeWorkspace(activePath)
    const app = { vault: vault.asVault(), workspace: workspace.asWorkspace() } as unknown as App
    return new NoteOpener(app, new OpenedNoteWait(app, 100))
  }

  describe('when the note is not open in an editor', () => {
    it('reports the note open once the workspace has opened it', async () => {
      expect(await openerOf().open(TODO)).toBe(true)
    })

    it('asks the workspace to open the note when it has no editor', async () => {
      const opener = openerOf()

      await opener.open(TODO)

      expect(workspace.opened).toEqual([TODO])
    })
  })

  describe('when the note is already open in an editor', () => {
    it('reports the note open without asking the workspace again', async () => {
      const opener = openerOf(TODO)

      await opener.open(TODO)

      expect(workspace.opened).toEqual([])
    })

    it('reports the note open when an editor already shows it', async () => {
      expect(await openerOf(TODO).open(TODO)).toBe(true)
    })
  })

  describe('when another note is open', () => {
    it('opens the asked-for note rather than keeping the one on screen', async () => {
      const opener = openerOf(OTHER)

      await opener.open(TODO)

      expect(workspace.opened).toEqual([TODO])
    })
  })

  describe('when no note exists at the path', () => {
    it('reports the note not opened when the vault has no file there', async () => {
      expect(await openerOf().open('Gone/away.md')).toBe(false)
    })

    it('asks the workspace to open nothing when the vault has no file there', async () => {
      const opener = openerOf()

      await opener.open('Gone/away.md')

      expect(workspace.opened).toEqual([])
    })
  })
})
