import { beforeEach, describe, expect, it } from 'vitest'
import { SessionProgress } from '../session-progress'
import { SessionListeners, StepReport } from '../session-listeners'
import { AgentsMdChain } from '../../agents/agents-md-chain'
import { AgentsMdFile } from '../../agents/agents-md-file'
import { TurnStep } from '../../engine/models/turn-step'

// A skill and a resolved chain are things the turn did, so they belong in the
// numbered list. Published on their own channels they landed beside it, and a
// skill loaded before an edit read as though it came after.
describe('SessionProgress', () => {
  let listeners: SessionListeners
  let steps: StepReport[]

  beforeEach(() => {
    listeners = new SessionListeners()
    steps = []
    listeners.steps.subscribe((step) => steps.push(step))
  })

  const publisherOf = () => new SessionProgress(listeners).publisher()

  describe('when a skill is loaded', () => {
    it('reports the skill as a step, so it is numbered with the rest', () => {
      publisherOf().skillLoaded('shopping-list')

      expect(steps).toEqual([{ label: 'Loaded skill', detail: 'shopping-list', refused: false }])
    })

    it('keeps a skill in the order it was loaded, before a later edit', () => {
      const publisher = publisherOf()

      publisher.skillLoaded('shopping-list')
      publisher.stepTaken(TurnStep.edited('applied'))

      expect(steps.map((step) => step.label)).toEqual(['Loaded skill', 'Edit'])
    })
  })

  describe('when a chain of instructions resolves', () => {
    const chainOf = () => new AgentsMdChain([new AgentsMdFile('AGENTS.md', '', 'be brief')])

    it('reports the instructions as a step, so they are numbered with the rest', () => {
      publisherOf().instructionsResolved(chainOf())

      expect(steps.map((step) => step.label)).toEqual(['Loaded agent instructions'])
    })

    it('names what applied without repeating the label', () => {
      publisherOf().instructionsResolved(chainOf())

      expect(steps[0].detail).not.toContain('Instructions applied')
    })

    it('reports an unchanged chain once, since a retarget resolves it again', () => {
      const publisher = publisherOf()

      publisher.instructionsResolved(chainOf())
      publisher.instructionsResolved(chainOf())

      expect(steps).toHaveLength(1)
    })

    it('reports nothing when the chain is empty', () => {
      publisherOf().instructionsResolved(new AgentsMdChain())

      expect(steps).toEqual([])
    })
  })
})
