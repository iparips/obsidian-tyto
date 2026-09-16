import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useRecordingLevel } from '../useRecordingLevel'

// happy-dom has no Web Audio, so the graph reads a fake analyser. These cover
// the lifecycle, not the numbers: only a person with a microphone can say the
// bars follow a voice.
class FakeAnalyser {
  fftSize = 2048
  reading = 128

  getByteTimeDomainData(samples: Uint8Array): void {
    samples.fill(this.reading)
  }
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = []
  readonly analyser = new FakeAnalyser()
  readonly close = vi.fn()
  readonly resume = vi.fn()
  sources = 0

  constructor() {
    FakeAudioContext.instances.push(this)
  }

  createAnalyser(): FakeAnalyser {
    return this.analyser
  }

  createMediaStreamSource(): { connect(): void; disconnect(): void } {
    this.sources += 1
    return { connect: () => undefined, disconnect: () => undefined }
  }
}

describe('useRecordingLevel', () => {
  let pendingFrames: (() => void)[]
  let stream: MediaStream | null

  const runFrame = () => act(() => pendingFrames.shift()?.())
  const openContexts = () =>
    FakeAudioContext.instances.filter((context) => !context.close.mock.calls.length)

  beforeEach(() => {
    FakeAudioContext.instances = []
    pendingFrames = []
    stream = { id: 'live' } as unknown as MediaStream
    vi.stubGlobal('AudioContext', FakeAudioContext)
    vi.stubGlobal('requestAnimationFrame', (callbackFn: () => void) => {
      pendingFrames.push(callbackFn)
      return pendingFrames.length
    })
    vi.stubGlobal('cancelAnimationFrame', () => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const renderLevel = (reducedMotion = false) =>
    renderHook(() => useRecordingLevel(() => stream, reducedMotion))

  describe('when nothing has begun', () => {
    it('builds no audio context while the panel is idle', () => {
      renderLevel()

      expect(FakeAudioContext.instances).toEqual([])
    })
  })

  describe('when a recording begins', () => {
    it('builds one audio context at the gesture', () => {
      const { result } = renderLevel()

      act(() => result.current.begin())

      expect(openContexts()).toHaveLength(1)
    })

    it('reads the level from the analyser once a frame runs', () => {
      const { result } = renderLevel()
      act(() => result.current.begin())

      FakeAudioContext.instances[0].analyser.reading = 192
      runFrame()

      expect(result.current.level).toBe(0.5)
    })

    it('wires one source however many frames run', () => {
      const { result } = renderLevel()
      act(() => result.current.begin())

      runFrame()
      runFrame()

      expect(FakeAudioContext.instances[0].sources).toBe(1)
    })
  })

  describe('when the stream goes', () => {
    it('closes the context once the recorder answers nothing', () => {
      const { result } = renderLevel()
      act(() => result.current.begin())
      runFrame()

      stream = null
      runFrame()

      expect(openContexts()).toEqual([])
    })

    it('returns the level to rest once the recorder answers nothing', () => {
      const { result } = renderLevel()
      act(() => result.current.begin())
      FakeAudioContext.instances[0].analyser.reading = 192
      runFrame()

      stream = null
      runFrame()

      expect(result.current.level).toBe(0)
    })
  })

  describe('when the user has asked for reduced motion', () => {
    it('holds the level at rest while the stream is open', () => {
      const { result } = renderLevel(true)
      act(() => result.current.begin())

      FakeAudioContext.instances[0].analyser.reading = 192
      runFrame()

      expect(result.current.level).toBe(0)
    })

    it('counts the elapsed seconds, which carry the liveness instead', () => {
      vi.useFakeTimers()
      const { result } = renderLevel(true)
      act(() => result.current.begin())

      vi.advanceTimersByTime(3000)
      runFrame()

      expect(result.current.elapsedSeconds).toBe(3)
      vi.useRealTimers()
    })
  })

  describe('when the panel unmounts', () => {
    it('closes the context so the microphone is not left graphed', () => {
      const { result, unmount } = renderLevel()
      act(() => result.current.begin())

      unmount()

      expect(openContexts()).toEqual([])
    })
  })
})
