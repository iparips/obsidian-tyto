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

  private isoDate(): string {
    const month = `${this.now.getMonth() + 1}`.padStart(2, '0')
    const day = `${this.now.getDate()}`.padStart(2, '0')
    return `${this.now.getFullYear()}-${month}-${day}`
  }

  private weekday(): string {
    return WEEKDAYS[this.now.getDay()]
  }
}
