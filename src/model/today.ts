const MILLIS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// What day it is, in the model's own words. Without it the model resolves
// "Friday last week" against its training cutoff, which in a vault of dated
// notes is wrong by years rather than by days.
export class Today {
  constructor(private now: Date) {}

  static of(now: Date = new Date()): Today {
    return new Today(now)
  }

  // ISO first, because that is how a dated note is named, and the weekday
  // beside it, because that is how the user says it.
  describe(): string {
    return `${this.isoDate()} (${this.weekday()})`
  }

  // The vault's folders are ISO week numbers, and the model was never told the
  // current one: it had to derive the week from the date, then the folder from
  // the week. Both are computed here so it derives neither.
  describeWithWeek(): string {
    const began = this.weekBegan()
    return `${this.describe()}, in week ${this.isoWeek()}, which began Monday ${Today.isoDateOf(began)}`
  }

  // ISO weeks run Monday to Sunday, so a Sunday belongs to the week that began
  // six days earlier rather than to the one starting tomorrow.
  private weekBegan(): Date {
    const began = new Date(this.now.getFullYear(), this.now.getMonth(), this.now.getDate())
    began.setDate(began.getDate() - Today.mondayOffset(this.now))
    return began
  }

  private static mondayOffset(date: Date): number {
    return (date.getDay() + 6) % 7
  }

  // Counted from the Thursday of this week: ISO assigns a week to the year
  // holding its Thursday, which is what puts 2027-01-01 in week 53 of 2026.
  private isoWeek(): number {
    const thursday = this.weekBegan()
    thursday.setDate(thursday.getDate() + 3)
    const firstThursday = Today.firstThursdayOf(thursday.getFullYear())
    const weeksBetween = (thursday.getTime() - firstThursday.getTime()) / MILLIS_PER_WEEK
    return Math.round(weeksBetween) + 1
  }

  private static firstThursdayOf(year: number): Date {
    const fourthOfJanuary = new Date(year, 0, 4)
    const monday = new Date(year, 0, 4 - Today.mondayOffset(fourthOfJanuary))
    monday.setDate(monday.getDate() + 3)
    return monday
  }

  private isoDate(): string {
    return Today.isoDateOf(this.now)
  }

  private static isoDateOf(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
  }

  private weekday(): string {
    return WEEKDAYS[this.now.getDay()]
  }
}
