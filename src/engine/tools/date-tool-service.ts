import { ToolCall } from '../../model/providers/types'
import { RelativeDateResolver } from '../../model/relative-date-resolver'
import { HarnessResult, Refusal } from './harness-result'
import { TextResult } from './harness-results'
import { ProgressLine } from '../progress-line'

// The harness side of resolve_date: it reads the phrase off the call, asks the
// resolver, and reports. It reaches no vault, so it takes no turn state.
export class DateToolService {
  // The instant is read per call rather than per session, in the same place
  // DateMessage reads it, so a turn running past midnight resolves against the
  // day it is on rather than the day it started.
  constructor(private nowFn: () => Date = () => new Date()) {}

  resolve(call: ToolCall): HarnessResult {
    const phrase = call.argument('phrase')
    const resolution = new RelativeDateResolver(this.nowFn()).resolve(phrase)
    if (resolution.hasFailed()) return Refusal.of(resolution.reason)
    return new TextResult(
      resolution.describe(),
      ProgressLine.resolved(phrase, resolution.isoDate()),
    )
  }
}
