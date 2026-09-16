import { AgentsMdChain } from '../agents/agents-md-chain'
import { TurnStep } from './turn-step'

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
    // Said once, as the turn nears its cap, so a user watching a long turn can
    // stop it rather than waiting for it to fail.
    readonly runningLowFn: (text: string) => void = () => undefined,
    // Every step a turn takes, collapsed in the panel: the entries say what the
    // turn produced, and this says what it did to get there.
    readonly publishStepTakenFn: (step: TurnStep) => void = () => undefined,
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
