import { beforeEach, describe, expect, it } from 'vitest'
import { SessionProgress } from '../session-progress'
import { SessionListeners, StepReport } from '../session-listeners'
import { AgentsMdChain } from '../../agents/agents-md-chain'
import { AgentsMdFile } from '../../agents/agents-md-file'
import { TurnStep } from '../../engine/turn-step'
import { TranscriptRepository } from '../transcript/transcript-repository'
import { StepRange } from '../transcript/models/transcript-record'

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
      publisherOf().skillLoadedFn('shopping-list')

      expect(steps).toEqual([{ label: 'Loaded skill', detail: 'shopping-list', refused: false }])
    })

    it('keeps a skill in the order it was loaded, before a later edit', () => {
      const publisher = publisherOf()

      publisher.skillLoadedFn('shopping-list')
      publisher.publishStepTakenFn(TurnStep.edited('applied', 'Lists/todo.md'))

      expect(steps.map((step) => step.label)).toEqual(['Loaded skill', 'Edit'])
    })
  })

  describe('when the session retargets', () => {
    it('reports the retarget as a step, so it is numbered with the rest', () => {
      publisherOf().retargetedFn('Lists/todo.md')

      expect(steps).toEqual([{ label: 'Retargeted', detail: 'Lists/todo.md', refused: false }])
    })

    // The header names the note now; the step says the session moved. Losing
    // either leaves the panel unable to tell one from the other.
    it('still moves the header, which is the channel the step does not replace', () => {
      const retargets: (string | null)[] = []
      listeners.retargets.subscribe((path) => retargets.push(path))

      publisherOf().retargetedFn('Lists/todo.md')

      expect(retargets).toEqual(['Lists/todo.md'])
    })

    it('counts the step against the transcript, so the recorded ranges stay in step', () => {
      const transcript = new TranscriptRepository()

      new SessionProgress(listeners, transcript).publisher().retargetedFn('Lists/todo.md')
      transcript.recordCall(new Map(), 1)

      expect(transcript.recordedSteps()[0].panelSteps).toEqual(new StepRange(1, 0))
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
