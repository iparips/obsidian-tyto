import { format, getISOWeek, startOfISOWeek } from 'date-fns'

// One date a phrase resolved to, in the shape the model reads it. The phrase
// travels with the date so the answer says what it resolved, and the week
// travels with it because the vault's folders are week numbers: without it the
// model derives a folder from a date, which is the second arithmetic step this
// tool exists to remove.
export class ResolvedDate {
  constructor(
    readonly phrase: string,
    readonly date: Date,
  ) {}

  // Typed as the other side of the union rather than boolean, so a caller that
  // checks it reads the date without a cast.
  hasFailed(): this is never {
    return false
  }

  // The same shape DateMessage sends for today, so the model reads one format
  // for both.
  describe(): string {
    return `"${this.phrase}" is ${this.isoDate()} (${this.weekday()}), in week ${this.isoWeek()}, which began Monday ${this.weekBegan()}.`
  }

  isoDate(): string {
    return format(this.date, 'yyyy-MM-dd')
  }

  private weekday(): string {
    return format(this.date, 'EEEE')
  }

  // getISOWeek rather than the week of the calendar year, so a date in the
  // first days of January reports the week of the year that week belongs to.
  private isoWeek(): number {
    return getISOWeek(this.date)
  }

  private weekBegan(): string {
    return format(startOfISOWeek(this.date), 'yyyy-MM-dd')
  }
}
