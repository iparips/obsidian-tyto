import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Recorder } from './recorder'

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = []
  static supportedTypes: string[] = ['audio/webm', 'audio/mp4', 'audio/aac']
  static isTypeSupported = (type: string) => FakeMediaRecorder.supportedTypes.includes(type)
  onstop: (() => void) | null = null
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  mimeType = 'audio/webm'

  constructor(
    public stream: { getTracks(): { stop(): void }[] },
    public options?: { mimeType: string },
  ) {
    FakeMediaRecorder.instances.push(this)
  }

  start(): void {}

  stop(): void {
    this.ondataavailable?.({ data: new Blob(['chunk'], { type: 'audio/webm' }) })
    this.onstop?.()
  }
}

describe('Recorder', () => {
  let trackStop: ReturnType<typeof vi.fn>
  let getUserMedia: ReturnType<typeof vi.fn>
  let recorder: Recorder

  beforeEach(() => {
    FakeMediaRecorder.instances = []
    FakeMediaRecorder.supportedTypes = ['audio/webm', 'audio/mp4', 'audio/aac']
    trackStop = vi.fn()
    getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: trackStop }] })
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder)
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    recorder = new Recorder()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('when recording completes', () => {
    it('resolves with blob and mime type when stop is called', async () => {
      await recorder.start()

      const utterance = await recorder.stop()

      expect(utterance.mimeType).toBe('audio/webm')
      expect(utterance.blob.size).toBeGreaterThan(0)
    })
  })

  describe('when choosing a mime type', () => {
    const chosenOptions = () => FakeMediaRecorder.instances[0].options

    it('picks audio/webm when it is the first supported type', async () => {
      await recorder.start()

      expect(chosenOptions()).toEqual({ mimeType: 'audio/webm' })
    })

    it('falls back to audio/mp4 when webm is unsupported', async () => {
      FakeMediaRecorder.supportedTypes = ['audio/mp4', 'audio/aac']

      await recorder.start()

      expect(chosenOptions()).toEqual({ mimeType: 'audio/mp4' })
    })

    it('falls back to the browser default when no listed type is supported', async () => {
      FakeMediaRecorder.supportedTypes = []

      await recorder.start()

      expect(chosenOptions()).toBeUndefined()
    })
  })

  describe('when permission is denied', () => {
    it('returns a transcription-step failure when mic permission is denied', async () => {
      getUserMedia.mockRejectedValue(new Error('denied'))

      const outcome = await recorder.start()

      expect(outcome).toEqual({
        ok: false,
        step: 'transcription',
        message: 'microphone unavailable: Error: denied',
      })
    })
  })

  describe('when recording is cancelled', () => {
    it('discards the recording when cancel is called', async () => {
      await recorder.start()

      recorder.cancel()

      expect(trackStop).toHaveBeenCalled()
      const utterance = await recorder.stop()
      expect(utterance.blob.size).toBe(0)
    })
  })
})
