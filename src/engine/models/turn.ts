import { TurnRepository } from '../turn-repository'
import { ToolDispatcher } from '../tool-dispatcher'

// One turn's collaborators, built together so nothing turn-scoped is reachable
// before a turn opens or after it ends.
export class Turn {
  constructor(
    readonly repository: TurnRepository,
    readonly toolDispatcher: ToolDispatcher,
  ) {}
}
