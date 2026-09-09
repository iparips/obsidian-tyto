import { ChatProvider } from './providers/types'
import { ChatTurn } from './providers/models/chat-turn'
import { Outcome } from '../shared/models/outcome'
import { HarnessReach } from './harness-reach'
import { ModelRequest } from './model-request'
import { ModelRequestMapper } from './model-request-mapper'
import { HarnessToolsService } from '../engine/tools/harness-tools-service'

// What one turn tells the model, and what the model may call back. The loop
// knows when to ask; ModelRequestMapper knows what the asking is made of.
export class ModelCaller {
  constructor(
    private modelProvider: ChatProvider,
    private harnessToolsService: HarnessToolsService,
  ) {}

  async ask(request: ModelRequest): Promise<Outcome<ChatTurn>> {
    return this.modelProvider.complete(
      ModelRequestMapper.toMessages(request, this.reach()),
      this.harnessToolsService.getToolCallSchemas(request.skills.length > 0),
      request.abortSignal,
    )
  }

  // Read once per call, so every message states the same reach.
  private reach(): HarnessReach {
    return new HarnessReach(
      this.harnessToolsService.allowedCommands(),
      this.harnessToolsService.hasSearchEnabled(),
    )
  }
}
