// A moment as the user's own clock read it: when a session was written, when a
// transcript was copied. Local rather than UTC, with the zone named, because
// both are read against the day the user had rather than against UTC, and the
// zone is what says which day that was when they have since moved.
export class LocalTimestamp {
  static of(at: Date): string {
    return `${LocalTimestamp.day(at)} ${LocalTimestamp.time(at)} ${LocalTimestamp.zone(at)}`
  }

  private static day(at: Date): string {
    return [at.getFullYear(), at.getMonth() + 1, at.getDate()]
      .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0'))
      .join('-')
  }

  private static time(at: Date): string {
    return [at.getHours(), at.getMinutes()].map((part) => String(part).padStart(2, '0')).join(':')
  }

  // The short name the runtime offers, falling back to the offset when it has
  // none: a stamp with no zone is worse than one reading GMT+10.
  private static zone(at: Date): string {
    const named = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
      .formatToParts(at)
      .find((part) => part.type === 'timeZoneName')
    return named?.value ?? LocalTimestamp.offset(at)
  }

  // Minutes west of UTC, which is why the sign is inverted against the label.
  private static offset(at: Date): string {
    const minutes = -at.getTimezoneOffset()
    const sign = minutes < 0 ? '-' : '+'
    const hours = String(Math.floor(Math.abs(minutes) / 60)).padStart(2, '0')
    return `UTC${sign}${hours}:${String(Math.abs(minutes) % 60).padStart(2, '0')}`
  }
}
