import { LocalTimestamp } from './local-timestamp'

// The line a restored session opens on, marking where what came back stops.
// It exists so a restore is visible at all: a restored panel and one that never
// went away are otherwise identical on screen.
//
// The stamp is when the session was last written, not when it was restored:
// what the user wants to know is how old the conversation they are resuming is.
// A record written before the field existed has none, and the line reads
// without it rather than guessing a time.
//
// It says nothing about the thinner transcript those turns carry. That gap is
// real, but it only shows for a user who copies a transcript, and the setting
// is off by default: a line every restore pays for to warn about something most
// never meet is worse than the gap.
export class RestoredText {
  static of(writtenAt: Date | null): string {
    return writtenAt === null
      ? 'Session restored.'
      : `Session restored from ${LocalTimestamp.of(writtenAt)}.`
  }
}
