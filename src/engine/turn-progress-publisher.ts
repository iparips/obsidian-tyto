import { AgentsMdChain } from '../agents/agents-md-chain'
import { TurnStep } from './models/turn-step'

// What a turn publishes as it runs, so a command entry lands before the edit
// that follows it. One way: nothing here returns anything the turn reads, and a
// silent publisher is a working engine. The plugin supplies the callbacks, so
// the engine narrates without knowing where any of it lands.
export class TurnProgressPublisher {
  constructor(
    readonly commandRan: (text: string) => void,
    readonly answered: (text: string, sources: string[]) => void,
    readonly retargeted: (path: string) => void,
    readonly instructionsResolved: (chain: AgentsMdChain) => void,
    readonly skillLoaded: (name: string) => void,
    // Said once, as the turn nears its cap, so a user watching a long turn can
    // stop it rather than waiting for it to fail.
    readonly runningLow: (text: string) => void = () => undefined,
    // Every step a turn takes, collapsed in the panel: the entries say what the
    // turn produced, and this says what it did to get there.
    readonly stepTaken: (step: TurnStep) => void = () => undefined,
  ) {}

  static silent(): TurnProgressPublisher {
    return new TurnProgressPublisher(
      () => undefined,
      () => undefined,
      () => undefined,
      () => undefined,
      () => undefined,
    )
  }
}
