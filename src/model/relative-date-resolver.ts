import * as chrono from 'chrono-node'
import { ParsedResult } from 'chrono-node'
import { ResolvedDate } from './resolved-date'

// What a phrase could not be read as, in the model's terms. It says what to do
// next rather than only that it failed, because a model told only "no date"
// tries a variant of the same phrase.
export class UnresolvedDate {
  constructor(readonly reason: string) {}

  hasFailed(): this is UnresolvedDate {
    return true
  }
}

// A union of two classes rather than a nullable: hasFailed narrows, so a
// refusal has no date to read by mistake and a resolve has no reason.
export type DateResolution = ResolvedDate | UnresolvedDate

// A phrase in the user's own words, read as a date. chrono does the
// interpretation, so a phrase it does not know refuses rather than resolving to
// something plausible, and this is the only file that imports it.
export class RelativeDateResolver {
  // The instant Today holds rather than the wall clock, so the tool and the
  // date line can never disagree, and a test fixing the instant gets a fixed
  // answer.
  constructor(private now: Date) {}

  resolve(phrase: string): DateResolution {
    const results = chrono.parse(phrase, this.now)
    if (results.length === 0) return RelativeDateResolver.nothingParsed(phrase)
    if (results.length > 1) return RelativeDateResolver.tooManyParsed(phrase, results)
    return RelativeDateResolver.oneParsed(phrase, results[0])
  }

  // Detected from what chrono says it knew rather than from the date it
  // returned: a bare month resolves to its first day, so the date alone cannot
  // tell an underspecified phrase from a precise one.
  private static oneParsed(phrase: string, result: ParsedResult): DateResolution {
    if (!RelativeDateResolver.namesADay(result)) return RelativeDateResolver.noSingleDay(phrase)
    return new ResolvedDate(phrase, result.start.date())
  }

  private static namesADay(result: ParsedResult): boolean {
    return result.start.isCertain('day') || result.start.isCertain('weekday')
  }

  // A duration is the common miss and the one worth naming: "three weeks" is a
  // length of time and could be counted in either direction, where "three weeks
  // ago" is a day. Sending that once is reading the refusal rather than cycling
  // through synonyms, which is what the last sentence rules out.
  private static nothingParsed(phrase: string): UnresolvedDate {
    return new UnresolvedDate(
      `no date in "${phrase}": a phrase has to name a point in time rather than a length of one. ` +
        `Where the user gave a span, send the end of it you mean, as "three weeks ago" does for "three weeks". ` +
        `Where they named no direction at all, ask which date they mean rather than trying more wordings.`,
    )
  }

  // Taking the first would be choosing for the user, so both are named and the
  // model asks which. The last sentence is the one nothingParsed already
  // carries: a turn met this refusal and answered it with five more wordings of
  // the same day, spending eight steps on a date its first call had returned.
  private static tooManyParsed(phrase: string, results: ParsedResult[]): UnresolvedDate {
    const dates = results.map((result) => new ResolvedDate(phrase, result.start.date()).isoDate())
    return new UnresolvedDate(
      `"${phrase}" names more than one date: ${dates.join(' and ')}. Ask the user which one they mean, ` +
        `rather than rewording the phrase: a rewording is a new question about the same day, and the day you already resolved is the answer.`,
    )
  }

  private static noSingleDay(phrase: string): UnresolvedDate {
    return new UnresolvedDate(`"${phrase}" names no single day. Ask the user which date they mean.`)
  }
}
