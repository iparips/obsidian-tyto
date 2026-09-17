import { beforeEach, describe, expect, it } from 'vitest'
import { SessionProgress } from '../session-progress'
import { RetargetReport, SessionListeners, ProgressLineReport } from '../session-listeners'
import { AgentsMdChain } from '../../agents/agents-md-chain'
import { AgentsMdFile } from '../../agents/agents-md-file'
import { ProgressLine } from '../../engine/progress-line'

// A skill and a resolved chain are things the turn did, so they belong in the
// numbered list. Published on their own channels they landed beside it, and a
// skill loaded before an edit read as though it came after.
describe('SessionProgress', () => {
  let listeners: SessionListeners
  let steps: ProgressLineReport[]

  beforeEach(() => {
    listeners = new SessionListeners()
    steps = []
    listeners.steps.subscribe((step) => steps.push(step))
  })

  const publisherOf = () => new SessionProgress(listeners).publisher()

  describe('when a skill is loaded', () => {
    it('reports the skill as a step, so it is numbered with the rest', () => {
      publisherOf().skillLoadedFn('shopping-list')

      expect(steps).toEqual([
        {
          label: 'Loaded skill',
          detail: 'shopping-list',
          refused: false,
          note: null,
          wroteDirect: false,
        },
      ])
    })

    it('keeps a skill in the order it was loaded, before a later edit', () => {
      const publisher = publisherOf()

      publisher.skillLoadedFn('shopping-list')
      publisher.publishProgressLineFn(ProgressLine.edited('applied', 'Lists/todo.md'))

      expect(steps.map((step) => step.label)).toEqual(['Loaded skill', 'Edit'])
    })
  })

  describe('when the session retargets', () => {
    it('moves the header, which is the one channel a retarget reaches', () => {
      const retargets: RetargetReport[] = []
      listeners.retargets.subscribe((report) => retargets.push(report))

      publisherOf().retargetedFn('Lists/todo.md', true)

      expect(retargets).toEqual([{ path: 'Lists/todo.md', byUser: true }])
    })

    // The header follows either way. byUser is read by nothing now the timeline
    // shows neither, and stays because the engine has two callers to tell apart.
    it('says who moved it, so the two callers stay apart', () => {
      const retargets: RetargetReport[] = []
      listeners.retargets.subscribe((report) => retargets.push(report))

      publisherOf().retargetedFn('Lists/todo.md', false)

      expect(retargets).toEqual([{ path: 'Lists/todo.md', byUser: false }])
    })

    // Not a step: a retarget belongs to the moment it happened, and the note it
    // moved to is what the next turn names as its target.
    it('publishes no step, since a retarget belongs to no turn', () => {
      publisherOf().retargetedFn('Lists/todo.md', true)

      expect(steps).toEqual([])
    })
  })

  describe('when a chain of instructions resolves', () => {
    const chainOf = () => new AgentsMdChain([new AgentsMdFile('AGENTS.md', '', 'be brief')])

    it('reports the instructions as a step, so they are numbered with the rest', () => {
      publisherOf().instructionsResolvedFn(chainOf())

      expect(steps.map((step) => step.label)).toEqual(['Loaded agent instructions'])
    })

    it('names what applied without repeating the label', () => {
      publisherOf().instructionsResolvedFn(chainOf())

      expect(steps[0].detail).not.toContain('Instructions applied')
    })

    it('reports an unchanged chain once, since a retarget resolves it again', () => {
      const publisher = publisherOf()

      publisher.instructionsResolvedFn(chainOf())
      publisher.instructionsResolvedFn(chainOf())

      expect(steps).toHaveLength(1)
    })

    it('reports nothing when the chain is empty', () => {
      publisherOf().instructionsResolvedFn(new AgentsMdChain())

      expect(steps).toEqual([])
    })
  })
})
