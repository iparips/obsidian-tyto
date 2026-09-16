import { useEffect, useRef, useState } from 'react'
import { RecordingAudioGraph } from './recording-audio-graph'

export interface RecordingLevel {
  // 0 to 1, held at rest where the user has asked for less animation.
  level: number
  elapsedSeconds: number
  // Called from the record gesture itself: WebKit suspends a context built
  // outside a user gesture, and Obsidian on iOS is a WKWebView.
  begin(): void
}

const AT_REST = 0
// Long enough for a permission prompt the user answers, short enough that a
// refused microphone does not leave a context open with nothing to read.
const WAIT_FOR_STREAM_MS = 30_000

// The level and the clock, which are the two live facts a recording strip
// shows. Both end with the stream, so one hook owns the frame loop that feeds
// them.
export const useRecordingLevel = (
  streamFn: () => MediaStream | null,
  reducedMotion = prefersReducedMotion(),
): RecordingLevel => {
  const [level, setLevel] = useState(AT_REST)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const graph = useRef<RecordingAudioGraph | null>(null)
  const startedAt = useRef(0)
  const frame = useRef<number | null>(null)
  const running = useRef(false)
  // The stream arrives after getUserMedia resolves, so the first frames run
  // before it. Only a stream that has been seen and then gone ends the loop.
  const streamArrived = useRef(false)

  // Read through a ref so the loop reads today's stream rather than the one
  // captured at the gesture.
  const readStream = useRef(streamFn)
  readStream.current = streamFn

  const release = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    running.current = false
    streamArrived.current = false
    graph.current?.close()
    graph.current = null
    setLevel(AT_REST)
    setElapsedSeconds(0)
  }

  // Nothing to read: either the stream has gone, or the gesture that would have
  // opened it was refused and none is coming.
  const hasNothingToRead = (): boolean =>
    streamArrived.current || Date.now() - startedAt.current > WAIT_FOR_STREAM_MS

  // One frame's work: count the clock, read the level, and let go once there is
  // nothing left to read.
  const readFrame = useRef(() => {})
  readFrame.current = () => {
    const stream = readStream.current()
    if (!stream) return hasNothingToRead() ? release() : undefined
    streamArrived.current = true
    setElapsedSeconds(Math.floor((Date.now() - startedAt.current) / 1000))
    if (reducedMotion) return
    graph.current?.listenTo(stream)
    setLevel(graph.current?.readLevel() ?? AT_REST)
  }

  // A frame loop rather than a timer, so it stops when the panel is
  // backgrounded. It runs without a graph too, since the clock needs no audio.
  const scheduleFrame = () => {
    frame.current = requestAnimationFrame(() => {
      readFrame.current()
      if (running.current) scheduleFrame()
    })
  }

  useEffect(() => () => release(), [])

  return {
    level,
    elapsedSeconds,
    begin: () => {
      if (running.current) return
      running.current = true
      graph.current = RecordingAudioGraph.open()
      startedAt.current = Date.now()
      scheduleFrame()
    },
  }
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
