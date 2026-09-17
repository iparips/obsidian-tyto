import { AgentsMdChain } from '../agents/agents-md-chain'
import { ProgressLine } from './progress-line'

// What a turn publishes as it runs. One way: nothing here returns anything the
// turn reads, and a silent publisher is a working engine. The plugin supplies
// the callbacks, so the engine narrates without knowing where any of it lands.
export class TurnProgressPublisher {
  constructor(
    readonly publishModelAnswerFn: (text: string, sources: string[]) => void,
    // byUser separates the two callers: the user opening a note is the only
    // retarget the timeline shows, since a tool that opened one said so in the
    // steps already.
    readonly retargetedFn: (path: string | null, byUser: boolean) => void,
    readonly instructionsResolvedFn: (chain: AgentsMdChain) => void,
    readonly skillLoadedFn: (name: string) => void,
    // News about a turn that is otherwise fine: the step budget running low, and
    // a write that took the vault path. Both land inside the open turn, which is
    // what the user is reading.
    readonly warnedFn: (text: string) => void = () => undefined,
    // Every step a turn takes, collapsed in the panel: the entries say what the
    // turn produced, and this says what it did to get there.
    readonly publishProgressLineFn: (step: ProgressLine) => void = () => undefined,
  ) {}

  static silent(): TurnProgressPublisher {
    return new TurnProgressPublisher(
      () => undefined,
      () => undefined,
      () => undefined,
      () => undefined,
    )
  }
}
