import { ChatTurn } from '../../model/providers/models/chat-turn'
import { Outcome } from '../../shared/models/outcome'
import { ChatProvider } from '../../model/providers/types'
import { ModelRequest } from '../../model/model-request'
import { ModelRequestMapper } from '../../model/model-request-mapper'
import { ModelRequestParts } from '../../model/model-request-parts'
import { HarnessToolsService } from '../tools/harness-tools-service'
import { SessionRepository } from '../../session/session-repository'
import { TranscriptRepository } from '../../session/transcript/transcript-repository'
import { TurnCancellationController } from './turn-cancellation-controller'
import { TurnRepository } from './turn-repository'

// One of the two outward calls a step makes. The loop that decides when to make
// it is ConversationTurnRunner; what it calls back is ToolCallExecutor.
export class ModelService {
  constructor(
    private sessionRepository: SessionRepository,
    private turnRepository: TurnRepository,
    private turnCancellationController: TurnCancellationController,
    private modelProvider: ChatProvider,
    private harnessToolsService: HarnessToolsService,
    private transcriptRepository: TranscriptRepository,
  ) {}

  // Logged around the call rather than after it, since a turn that feels slow is
  // one model call taking its time rather than the loop doing work between them.
  async askModel(step: number): Promise<Outcome<ChatTurn>> {
    const askedAt = Date.now()
    const request = this.requestForModel()
    const parts = ModelRequestMapper.toParts(request)
    // Recorded before the call rather than after it, so a step the provider
    // failed on still says what it was sent.
    this.recordCall(parts, request.chatHistory.length)

    const answer = await this.modelProvider.complete(
      parts.asMessagesAround(request.chatHistory),
      this.harnessToolsService.getToolCallSchemas(this.turnRepository.definesSkills()),
      this.turnCancellationController.signal(),
    )

    if (answer.succeeded()) this.logStep(step, answer.value, Date.now() - askedAt)
    return answer
  }

  // The reach is read here rather than deeper down, so every message the turn
  // sends states the same one.
  private requestForModel(): ModelRequest {
    return new ModelRequest(
      this.turnRepository.targetNote(),
      this.turnRepository.skills(),
      this.turnRepository.agentMdChain(),
      this.sessionRepository.chatHistory(),
      this.harnessToolsService.allowedCommands(),
      this.harnessToolsService.hasSearchEnabled(),
    )
  }

  private recordCall(parts: ModelRequestParts, historyLength: number): void {
    this.transcriptRepository.recordCall(
      new Map([
        ['systemPrompt', parts.systemPrompt.content],
        ['dateMessage', parts.dateMessage.content],
        ['sessionTarget', parts.sessionTarget.content],
      ]),
      historyLength,
    )
  }

  // The only record of why a turn spent its iterations: the panel shows commands
  // and answers, but not the edits the model retried or the note it aimed at.
  private logStep(step: number, turn: ChatTurn, waitedMs: number): void {
    const calls = turn.isText() ? 'text' : turn.calls.map((call) => call.name).join(', ')
    const path = this.turnRepository.targetNote()?.path ?? 'no note'
    console.debug(`[tyto] iteration ${step + 1} on ${path}: ${calls} (${waitedMs}ms)`)
  }
}
