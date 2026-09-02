export type FailureStep = 'transcription' | 'chat' | 'apply'

export class Success<T> {
  constructor(readonly value: T) {}

  hasFailed(): this is Failure<T> {
    return false
  }
}

export class Failure<T> {
  constructor(
    readonly step: FailureStep,
    readonly message: string,
  ) {}

  hasFailed(): this is Failure<T> {
    return true
  }
}

// A union of two classes rather than one class: hasFailed narrows through
// `this is Failure<T>`, so a failure has no value property to read by mistake.
export type Outcome<T> = Success<T> | Failure<T>

export class Outcomes {
  static success<T>(value: T): Outcome<T> {
    return new Success(value)
  }

  static failure<T>(step: FailureStep, message: string): Outcome<T> {
    return new Failure<T>(step, message)
  }
}
