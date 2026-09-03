export type FailureStep = 'transcription' | 'chat' | 'apply'

export class Success<T> {
  constructor(readonly value: T) {}

  succeeded(): this is Success<T> {
    return true
  }

  hasFailed(): this is Failure<T> {
    return false
  }

  wasCancelled(): this is Cancelled<T> {
    return false
  }
}

export class Failure<T> {
  constructor(
    readonly step: FailureStep,
    readonly message: string,
  ) {}

  succeeded(): this is Success<T> {
    return false
  }

  hasFailed(): this is Failure<T> {
    return true
  }

  wasCancelled(): this is Cancelled<T> {
    return false
  }
}

// The user stopped the turn, which is the request working rather than breaking,
// so it carries what the turn left rather than a message to render as an error.
export class Cancelled<T> {
  constructor(
    readonly step: FailureStep,
    readonly writtenNotes: readonly string[] = [],
  ) {}

  succeeded(): this is Success<T> {
    return false
  }

  hasFailed(): this is Failure<T> {
    return false
  }

  wasCancelled(): this is Cancelled<T> {
    return true
  }
}

// A union of classes rather than one class: hasFailed narrows through
// `this is Failure<T>`, so a failure has no value property to read by mistake.
export type Outcome<T> = Success<T> | Failure<T> | Cancelled<T>

// What something that cannot be cancelled returns: parsing, reading a note,
// running a command. Narrower than Outcome, so hasFailed still narrows to the
// value and no caller writes a branch it can never reach.
export type Attempt<T> = Success<T> | Failure<T>

export class Outcomes {
  // The precise case rather than Outcome, so a producer that never cancels can
  // declare Attempt and still build its outcomes here.
  static success<T>(value: T): Success<T> {
    return new Success(value)
  }

  static failure<T>(step: FailureStep, message: string): Failure<T> {
    return new Failure<T>(step, message)
  }

  static cancelled<T>(step: FailureStep, writtenNotes: readonly string[] = []): Cancelled<T> {
    return new Cancelled<T>(step, writtenNotes)
  }

  // Relays an outcome a caller cannot use, so a caller that only wanted the
  // value does not have to know which of the two non-success cases it holds.
  static relay<T>(outcome: Failure<unknown> | Cancelled<unknown>): Outcome<T> {
    if (outcome instanceof Cancelled) return Outcomes.cancelled(outcome.step, outcome.writtenNotes)
    return Outcomes.failure(outcome.step, outcome.message)
  }
}
