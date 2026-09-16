// A time-domain reading centres on 128, so distance from it is the amplitude.
const SILENCE = 128
const FULL_SCALE = 128

// The audio graph behind the level meter: a context, an analyser, and the
// source wired from whichever stream is recording. Built at a gesture and
// closed when the stream goes, so a panel at rest holds no context (NFR3).
export class RecordingAudioGraph {
  private source: MediaStreamAudioSourceNode | null = null
  private listeningTo: MediaStream | null = null
  // Pinned to ArrayBuffer, since getByteTimeDomainData rejects the
  // ArrayBufferLike a bare Uint8Array widens to under newer lib types.
  private readonly samples: Uint8Array<ArrayBuffer>

  private constructor(
    private readonly context: AudioContext,
    private readonly analyser: AnalyserNode,
  ) {
    this.samples = new Uint8Array(analyser.fftSize)
  }

  // Null where the platform has no Web Audio, so a recording still runs
  // without a meter rather than failing at the gesture that starts it.
  static open(): RecordingAudioGraph | null {
    if (typeof AudioContext === 'undefined') return null
    const context = new AudioContext()
    const analyser = context.createAnalyser()
    analyser.fftSize = 2048
    // Suspended anyway on a platform that ignores the gesture, and harmless
    // where it is already running.
    void context.resume?.()
    return new RecordingAudioGraph(context, analyser)
  }

  // Idempotent per stream: the loop calls this every frame, and only the first
  // stream of a recording builds a source.
  listenTo(stream: MediaStream): void {
    if (this.listeningTo === stream) return
    this.listeningTo = stream
    this.source = this.context.createMediaStreamSource(stream)
    this.source.connect(this.analyser)
  }

  // 0 to 1, as the loudest sample of the frame.
  readLevel(): number {
    if (!this.source) return 0
    this.analyser.getByteTimeDomainData(this.samples)
    return RecordingAudioGraph.peakOf(this.samples)
  }

  private static peakOf(samples: Uint8Array): number {
    const peak = samples.reduce(
      (loudest, sample) => Math.max(loudest, Math.abs(sample - SILENCE)),
      0,
    )
    return Math.min(peak / FULL_SCALE, 1)
  }

  close(): void {
    this.source?.disconnect()
    this.source = null
    this.listeningTo = null
    void this.context.close()
  }
}
