import { TOOL_SCHEMAS } from '../../tools/tool-schemas'

// A tool name followed by a JSON object, which is a call the model wrote as
// prose rather than emitting: `grep_notes{"pattern": "x"}`. The brace may follow
// the name directly or after a space, and a reply carries several run together.
const SPOKEN_CALL = /\b(NAMES)\b\s*\{/

// Built from the schemas rather than listed again, so a tool added later is
// recognised without this file changing.
const TOOL_NAME_ALTERNATIVES = TOOL_SCHEMAS.map((schema) => schema.name).join('|')

// The share of a reply that has to be call syntax before it reads as a call
// rather than as prose quoting one. A reply explaining a call to the user names
// it in a sentence; one that is a call is almost entirely the call.
const MOSTLY = 0.6

// A reply that is a tool call written as text. Some providers degrade into
// emitting call syntax in the content when a result disappoints them, and the
// harness reads content as the turn's reply: the raw JSON then reaches the user
// as the answer, which is never what they asked for.
//
// Judged on the reply alone, because a search that found nothing is exactly when
// this happens and there is no other signal to read.
export class SpokenToolCall {
  private constructor(private readonly names: readonly string[]) {}

  static inReply(reply: string): SpokenToolCall {
    return new SpokenToolCall(
      SpokenToolCall.isMostlyCalls(reply) ? SpokenToolCall.named(reply) : [],
    )
  }

  // A reply mentioning a tool in a sentence is prose about the tool, so the
  // length the calls account for decides it rather than their presence.
  private static isMostlyCalls(reply: string): boolean {
    const trimmed = reply.trim()
    if (trimmed === '') return false
    return SpokenToolCall.spokenLength(trimmed) / trimmed.length >= MOSTLY
  }

  // Each call is the name through to its closing brace. Counted by a scan rather
  // than matched whole, since a JSON object nests and a regular expression
  // cannot close it correctly.
  private static spokenLength(reply: string): number {
    return SpokenToolCall.callRanges(reply).reduce((total, length) => total + length, 0)
  }

  private static callRanges(reply: string): number[] {
    return [...reply.matchAll(SpokenToolCall.pattern('g'))].map(
      (match) => match[0].length - 1 + SpokenToolCall.objectLength(reply, match.index ?? 0),
    )
  }

  // From the opening brace to the one that closes it, so a nested object counts
  // as part of the call it sits in.
  private static objectLength(reply: string, from: number): number {
    const opened = reply.indexOf('{', from)
    if (opened === -1) return 0
    let depth = 0
    for (let at = opened; at < reply.length; at += 1) {
      if (reply[at] === '{') depth += 1
      if (reply[at] === '}') depth -= 1
      if (depth === 0) return at - opened + 1
    }
    return reply.length - opened
  }

  private static named(reply: string): string[] {
    return [...new Set([...reply.matchAll(SpokenToolCall.pattern('g'))].map((match) => match[1]))]
  }

  private static pattern(flags: string): RegExp {
    return new RegExp(SPOKEN_CALL.source.replace('NAMES', TOOL_NAME_ALTERNATIVES), flags)
  }

  wasSpoken(): boolean {
    return this.names.length > 0
  }

  // Names the tools, since the correction is to emit these as calls rather than
  // to write differently.
  message(): string {
    return `that reply was ${this.names.join(' and ')} written as text, not a tool call the harness can run: emit it as a tool call, or say in words what you found`
  }
}
