// A value: what to ask and what to offer. Holds no collaborator, so the panel
// renders it without reaching back into the engine.
export class AnswerRequest {
  constructor(
    readonly question: string,
    readonly suggestions: readonly string[] = [],
  ) {}
}
