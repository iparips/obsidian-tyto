import { AgentsMdChain } from '../agents/agents-md-chain'

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
