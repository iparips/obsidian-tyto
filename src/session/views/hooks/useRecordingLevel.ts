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

  // Read through a ref so the loop reads today's stream rather than the one
  // captured at the gesture.
  const readStream = useRef(streamFn)
  readStream.current = streamFn

  const release = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    graph.current?.close()
    graph.current = null
    setLevel(AT_REST)
    setElapsedSeconds(0)
  }

  // One frame's work: read the stream if it is there, and let go once it has
  // gone. The stream arrives after getUserMedia resolves, so the first frames
  // run before it.
  const readFrame = useRef(() => {})
  readFrame.current = () => {
    const stream = readStream.current()
    if (!stream) return release()
    setElapsedSeconds(Math.floor((Date.now() - startedAt.current) / 1000))
    if (reducedMotion) return
    graph.current?.listenTo(stream)
    setLevel(graph.current?.readLevel() ?? AT_REST)
  }

  // A frame loop rather than a timer, so it stops when the panel is
  // backgrounded.
  const scheduleFrame = () => {
    frame.current = requestAnimationFrame(() => {
      readFrame.current()
      if (graph.current) scheduleFrame()
    })
  }

  useEffect(() => () => release(), [])

  return {
    level,
    elapsedSeconds,
    begin: () => {
      if (graph.current) return
      graph.current = RecordingAudioGraph.open()
      startedAt.current = Date.now()
      scheduleFrame()
    },
  }
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
