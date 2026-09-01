import { Outcome, Outcomes } from '../engine/outcome'

export interface Utterance {
  blob: Blob
  mimeType: string
}

const MIME_PREFERENCES = ['audio/webm', 'audio/mp4', 'audio/aac']
const DEFAULT_MIME_TYPE = MIME_PREFERENCES[0]

export class Recorder {
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private mimeType = DEFAULT_MIME_TYPE

  async start(): Promise<Outcome<void>> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.beginRecording(stream)
      return Outcomes.success(undefined)
    } catch (error) {
      return Outcomes.failure('transcription', `microphone unavailable: ${String(error)}`)
    }
  }

  stop(): Promise<Utterance> {
    return new Promise((resolve) => {
      const recorder = this.recorder
      if (!recorder)
        return resolve({ blob: new Blob([], { type: this.mimeType }), mimeType: this.mimeType })
      recorder.onstop = () => resolve(this.takeUtterance(recorder))
      recorder.stop()
    })
  }

  cancel(): void {
    const recorder = this.recorder
    if (!recorder) return
    recorder.onstop = () => this.releaseStream(recorder)
    recorder.stop()
    this.reset()
  }

  private beginRecording(stream: MediaStream): void {
    this.mimeType = Recorder.supportedMimeType()
    console.debug('[voice-edit] recording as', this.mimeType || 'browser default')
    this.chunks = []
    this.recorder = new MediaRecorder(
      stream,
      this.mimeType ? { mimeType: this.mimeType } : undefined,
    )
    this.recorder.ondataavailable = (event) => this.chunks.push(event.data)
    this.recorder.start()
  }

  // '' asks the browser to choose, so an unlisted codec still records.
  private static supportedMimeType(): string {
    return MIME_PREFERENCES.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
  }

  private takeUtterance(recorder: MediaRecorder): Utterance {
    const mimeType = this.mimeType || recorder.mimeType || DEFAULT_MIME_TYPE
    const utterance = { blob: new Blob(this.chunks, { type: mimeType }), mimeType }
    console.debug('[voice-edit] captured', utterance.blob.size, 'bytes as', mimeType)
    this.releaseStream(recorder)
    this.reset()
    return utterance
  }

  private releaseStream(recorder: MediaRecorder): void {
    recorder.stream.getTracks().forEach((track) => track.stop())
  }

  private reset(): void {
    this.recorder = null
    this.chunks = []
  }
}
