import { beforeEach, describe, expect, it } from 'vitest'
import { TurnEndingKind } from '../../../engine/turn/ending/turn-ending-kind'
import { TranscriptRepository } from '../transcript-repository'
import { RestoredCounts } from '../models/restored-counts'
import { PartName } from '../models/transcript-record'

// A recorded step holds only what it did not share with the steps around it, so
// the reported session's twenty globs keep two system prompts rather than
// twenty.
describe('TranscriptRepository', () => {
  let transcript: TranscriptRepository

  beforeEach(() => {
    transcript = new TranscriptRepository()
  })

  const partsOf = (systemPrompt: string, target = 'note v1'): ReadonlyMap<PartName, string> =>
    new Map<PartName, string>([
      ['systemPrompt', systemPrompt],
      ['dateMessage', 'today'],
      ['sessionTarget', target],
    ])

  const recordCall = (historyLength: number, systemPrompt = 'prompt', target = 'note v1') =>
    transcript.recordCall(partsOf(systemPrompt, target), historyLength)

  const publishPanelSteps = (count: number) => {
    for (let index = 0; index < count; index++) transcript.panelStepPublished()
  }

  describe('when a session was restored', () => {
    beforeEach(() => {
      transcript = new TranscriptRepository(RestoredCounts.of(4, 0, 0))
    })

    it('starts the first recorded step past the restored history', () => {
      recordCall(6)

      expect(
        transcript.recordedSteps().map((step) => [step.history.first, step.history.last]),
      ).toEqual([[4, 5]])
    })

    it('holds no steps from before the restore', () => {
      expect(transcript.isEmpty()).toBe(true)
    })
  })

  // The restored entries carry the previous session's panel steps and turns, so
  // a step counting either from zero renders that session's work as this one's.
  describe('when a restored session already holds panel steps and turns', () => {
    beforeEach(() => {
      transcript = new TranscriptRepository(RestoredCounts.of(4, 3, 2))
    })

    it('starts the first recorded step past the restored panel steps', () => {
      recordCall(6)

      expect(transcript.recordedSteps()[0].panelSteps.first).toBe(3)
    })

    it('numbers the first recorded step past the restored turns', () => {
      recordCall(6)

      expect(transcript.recordedSteps()[0].turn).toBe(2)
    })

    it('numbers the step after an ending one turn on from the restored turns', () => {
      recordCall(6)
      transcript.recordEnding(TurnEndingKind.Replied)
      recordCall(8)

      expect(transcript.recordedSteps()[1].turn).toBe(3)
    })
  })

  describe('when a turn step is recorded', () => {
    it('holds the history range it was sent', () => {
      recordCall(1)
      recordCall(3)

      expect(
        transcript.recordedSteps().map((step) => [step.history.first, step.history.last]),
      ).toEqual([
        [0, 0],
        [1, 2],
      ])
    })

    it('holds a panel step range closed by the next recording', () => {
      recordCall(1)
      publishPanelSteps(2)
      recordCall(3)

      const [first] = transcript.recordedSteps()
      expect([first.panelSteps.first, first.panelSteps.last]).toEqual([0, 1])
    })

    it('owns only the panel steps published between the recordings either side', () => {
      publishPanelSteps(1)
      recordCall(1)
      publishPanelSteps(2)
      recordCall(3)
      publishPanelSteps(1)
      transcript.recordEnding(TurnEndingKind.Replied)

      expect(
        transcript.recordedSteps().map((step) => [step.panelSteps.first, step.panelSteps.last]),
      ).toEqual([
        [1, 2],
        [3, 3],
      ])
    })

    it('leaves the range empty for a step whose tool calls published nothing', () => {
      recordCall(1)
      transcript.recordEnding(TurnEndingKind.Replied)

      expect(transcript.recordedSteps()[0].panelSteps.isEmpty()).toBe(true)
    })
  })

  describe('when a turn ends', () => {
    it('closes the last step open panel range', () => {
      recordCall(1)
      publishPanelSteps(3)
      transcript.recordEnding(TurnEndingKind.Exhausted)

      const [only] = transcript.recordedSteps()
      expect([only.panelSteps.first, only.panelSteps.last]).toEqual([0, 2])
    })

    it('holds the kind and the step the harness decided it at', () => {
      recordCall(1)
      recordCall(2)
      transcript.recordEnding(TurnEndingKind.Stuck)

      expect(transcript.recordedEndings()).toEqual([
        { turn: 0, kind: TurnEndingKind.Stuck, step: 1 },
      ])
    })

    it('numbers the next turn steps from zero again', () => {
      recordCall(1)
      transcript.recordEnding(TurnEndingKind.Replied)
      recordCall(2)

      expect(transcript.recordedSteps().map((step) => [step.turn, step.step])).toEqual([
        [0, 0],
        [1, 0],
      ])
    })
  })

  describe('when a part repeats', () => {
    it('keeps one version and cites it from both steps', () => {
      recordCall(1)
      recordCall(2)

      expect(
        transcript.recordedSteps().map((step) => step.partNamed('systemPrompt')?.version),
      ).toEqual([1, 1])
      expect(
        transcript.recordedParts().filter((part) => part.name === 'systemPrompt'),
      ).toHaveLength(1)
    })
  })

  describe('when a part changes mid-session', () => {
    it('keeps both versions in the order they were sent', () => {
      recordCall(1, 'prompt')
      recordCall(2, 'prompt with skill')

      expect(
        transcript
          .recordedParts()
          .filter((part) => part.name === 'systemPrompt')
          .map((part) => [part.version, part.text]),
      ).toEqual([
        [1, 'prompt'],
        [2, 'prompt with skill'],
      ])
    })

    it('cites the version each step was actually sent', () => {
      recordCall(1, 'prompt', 'note v1')
      recordCall(2, 'prompt', 'note v2')

      expect(
        transcript.recordedSteps().map((step) => step.partNamed('sessionTarget')?.version),
      ).toEqual([1, 2])
    })
  })

  describe('when nothing has been recorded', () => {
    it('reports itself empty, so the button has nothing to copy', () => {
      expect(transcript.isEmpty()).toBe(true)
    })
  })
})
