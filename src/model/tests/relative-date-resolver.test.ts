import { describe, expect, it } from 'vitest'
import { RelativeDateResolver, UnresolvedDate } from '../relative-date-resolver'

const FRIDAY = new Date(2026, 8, 11)
const WEDNESDAY = new Date(2026, 8, 9)
const SATURDAY = new Date(2026, 8, 12)

const resolve = (phrase: string, now: Date = FRIDAY) =>
  new RelativeDateResolver(now).resolve(phrase)

const isoOf = (phrase: string, now: Date = FRIDAY): string => {
  const resolution = resolve(phrase, now)
  if (resolution.hasFailed()) throw new Error(`expected "${phrase}" to resolve`)
  return resolution.isoDate()
}

const reasonOf = (phrase: string, now: Date = FRIDAY): string => {
  const resolution = resolve(phrase, now)
  if (!resolution.hasFailed()) throw new Error(`expected "${phrase}" to refuse`)
  return resolution.reason
}

describe('RelativeDateResolver', () => {
  // The reference date is Friday 2026-09-11, the day of the reported turn.
  describe('when a phrase names one day', () => {
    it('reads a weekday shifted back a week as the Friday of the previous week', () => {
      expect(isoOf('last Friday')).toBe('2026-09-04')
    })

    it('reads a weekday named with the week it fell in', () => {
      expect(isoOf('Saturday last week')).toBe('2026-09-05')
    })

    it('counts back a number of days when the phrase gives an offset', () => {
      expect(isoOf('3 days ago')).toBe('2026-09-08')
    })

    it('passes a phrase that is already a date through as itself', () => {
      expect(isoOf('2026-09-04')).toBe('2026-09-04')
    })

    it('reads a date out of surrounding prose, so the phrase needs no cleaning up', () => {
      expect(isoOf('the beautiful Saturday')).toBe('2026-09-12')
    })
  })

  // The instant is the reference date, so the same phrase said on two days is
  // two dates. This is what keeps the tool and the date line agreeing.
  describe('when the same phrase is resolved from a different instant', () => {
    it('reaches the same Friday from midweek, since the week has not turned over', () => {
      expect(isoOf('last Friday', WEDNESDAY)).toBe('2026-09-04')
    })

    it('reads last Friday on a Saturday as the Friday just gone', () => {
      expect(isoOf('last Friday', SATURDAY)).toBe('2026-09-11')
    })
  })

  describe('when a phrase names no single day', () => {
    it('refuses a phrase holding no date at all, and says to ask the user', () => {
      expect(reasonOf('my todo list')).toContain(
        'Where they named no direction at all, ask which date they mean',
      )
    })

    // The common miss, and the one the refusal names: a length of time could be
    // counted in either direction, so it is not a day.
    it('refuses a duration, naming the direction it lacks', () => {
      expect(reasonOf('three weeks')).toContain(
        'a phrase has to name a point in time rather than a length of one',
      )
    })

    it('resolves the same span once a direction is given', () => {
      expect(isoOf('three weeks ago')).toBe('2026-08-21')
    })

    it('names both dates when a phrase parses to two, rather than taking the first', () => {
      expect(reasonOf('Friday or Saturday')).toContain(
        '"Friday or Saturday" names more than one date: 2026-09-11 and 2026-09-12.',
      )
    })

    // A turn answered this refusal with five more wordings of the same day,
    // spending eight of its twenty steps on a date its first call had returned.
    it('says to ask rather than reword, since a rewording asks the same question', () => {
      expect(reasonOf('Friday or Saturday')).toContain('rather than rewording the phrase')
    })

    // One result, so the count cannot catch it: a bare month name knows a month
    // and no day, where every resolvable phrase knows a day or a weekday.
    it('refuses a bare month, which parses to one result knowing no day', () => {
      expect(reasonOf('September')).toBe(
        '"September" names no single day. Ask the user which date they mean.',
      )
    })

    // Same shape as a bare month: chrono knows the month and implies the day
    // from the reference date, so resolving it would glob one day out of
    // thirty on nothing the user said.
    it('refuses a phrase shifting only the month, since the day would be implied', () => {
      expect(reasonOf('last month')).toBe(
        '"last month" names no single day. Ask the user which date they mean.',
      )
    })

    it('carries no date on a refusal', () => {
      expect(resolve('a while back')).toBeInstanceOf(UnresolvedDate)
    })
  })
})
