// A value: which notes to offer and what the pick is for. Holds no
// collaborator, so the panel renders it without reaching back into the engine.
export class ChoiceRequest {
  constructor(
    readonly candidates: readonly string[],
    readonly purpose: string,
  ) {}
}
