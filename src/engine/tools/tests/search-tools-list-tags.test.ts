import { beforeEach, describe, expect, it } from 'vitest'
import { SearchToolsService } from '../search-tools-service'
import { NoteGlob } from '../../../search/note-glob'
import { NoteGrep } from '../../../search/note-grep'
import { TagReader } from '../../../search/tag-reader'
import { FakeVault } from '../../../test-support/fake-vault'
import { aToolCall, aTurnState } from '../../../test-support/builders'
import { TurnState } from '../harness-result'

const JOURNAL = '1 - Journal/Weekly/Week-35/04-09-Fri.md'
const QUOTE = 'Quotes/roofing.md'

describe('SearchToolsService listing tags', () => {
  let vault: FakeVault
  let turn: TurnState

  beforeEach(() => {
    vault = new FakeVault()
      .withNote(JOURNAL, 'friday')
      .withTags(JOURNAL, ['#health'])
      .withNote(QUOTE, 'roofing')
      .withTags(QUOTE, ['#health', '#roofing'])
    turn = aTurnState()
  })

  const listTags = (args: Record<string, unknown> = {}) =>
    new SearchToolsService(
      new NoteGlob(vault.asVault()),
      new NoteGrep(vault.asVault()),
      new TagReader(vault.asVault(), vault.asMetadataCache()),
    ).listTags(aToolCall('list_tags', args))

  describe('when the model calls the tool', () => {
    it('answers the report text as the result', () => {
      expect(listTags().result).toBe('#health - 2 notes\n#roofing - 1 note')
    })

    it('publishes a progress line naming the tag count', () => {
      expect(listTags().publishStepSummary?.detail).toBe('the whole vault — 2 tags')
    })

    it('names the filter on the progress line when one was given', () => {
      expect(listTags({ filter: 'roof' }).publishStepSummary?.detail).toBe('roof — 1 tag')
    })

    // What keeps a vocabulary tool out of the write path: a tag it returned is
    // not a note the model may then open.
    it('records no path, so nothing it returned becomes openable', () => {
      listTags()

      expect(turn.pathsReturnedByVault.includes(JOURNAL)).toBe(false)
    })

    it('passes no filter to the reader when the model sent none', () => {
      expect(listTags().result).toContain('#roofing')
    })
  })
})
