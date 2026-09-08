import { ChatMessage, ToolCall } from '../providers/types'
import { ChatTurn } from '../providers/models/chat-turn'
import { Outcome, Outcomes } from '../shared/models/outcome'
import { Turn } from './turn/turn'
import { TurnFactory } from './turn/turn-factory'
import { TurnRepository } from './turn/turn-repository'
import { SessionRepository } from '../session/session-repository'
import { TurnProgressPublisher } from './turn-progress-publisher'
import { IterationBudget } from './turn/iteration-budget'
import { RepeatedRefusal } from './turn/repeated-refusal'
import { ModelCaller, ModelRequest } from './model-caller'
import { TurnConclusion } from './turn-conclusion'
import { UtteranceQueue } from './utterance-queue'

export class EditEngine {
  // Null between turns, so a cancel arriving after one finished reaches nothing.
  private runningTurn: Turn | null = null
  private readonly utterances = new UtteranceQueue((text) => this.runTurn(text))

  constructor(
    private sessionRepository: SessionRepository,
    private turnFactory: TurnFactory,
    private modelCaller: ModelCaller,
    private turnConclusion: TurnConclusion,
    private turnProgressPublisher: TurnProgressPublisher,
  ) {}

  // A note the user opened themselves is as much a retarget as one a command
  // opened, so the session follows rather than editing the note behind them.
  followActiveNote(path: string): void {
    if (path === this.sessionRepository.targetNote()) return
    this.sessionRepository.changeTargetNote(path)
    this.turnProgressPublisher.retargeted(path)
  }

  // Ignored between turns: a cancel that arrives after the turn finished has
  // nothing left to stop.
  cancelTurn(): void {
    this.runningTurn?.cancellation.cancel()
  }

  processUtterance(text: string): Promise<Outcome<string>> {
    return this.utterances.enqueue(text)
  }

  // The utterance is recorded before the turn opens, because a turn that cannot
  // open still had something said to it. Left unrecorded, the history ends at
  // the last instruction that ran, and a following "retry" retries that one.
  private async runTurn(text: string): Promise<Outcome<string>> {
    this.sessionRepository.appendChatMessage(ChatMessage.user(text))
    const turnOutcome = await this.turnFactory.openTurn()
    if (turnOutcome.hasFailed()) return Outcomes.failure(turnOutcome.step, turnOutcome.message)
    this.runningTurn = turnOutcome.value
    try {
      return await this.runAgentLoop(turnOutcome.value)
    } finally {
      this.runningTurn = null
    }
  }

  private async runAgentLoop(turn: Turn): Promise<Outcome<string>> {
    const iterationBudget = new IterationBudget()
    const repeatedRefusal = new RepeatedRefusal()
    for (let iteration = 0; !iterationBudget.isSpent(); iteration++) {
      if (turn.cancellation.isCancelled()) return this.concludeCancelled(turn)
      const modelAnswer = await this.askModel(turn, iteration)
      if (!modelAnswer.succeeded())
        return this.turnConclusion.unfinished(modelAnswer, turn.repository.writtenNotes())
      if (modelAnswer.value.isText()) return this.concludeUtterance(turn, modelAnswer.value.content)
      await this.executeToolCalls(modelAnswer.value.calls, turn, repeatedRefusal)
      if (repeatedRefusal.isStuck()) return TurnConclusion.stuck(repeatedRefusal)
      iterationBudget.spend(modelAnswer.value.calls.length)
      if (iterationBudget.justRanLow())
        this.turnProgressPublisher.runningLow(iterationBudget.warning())
    }
    return TurnConclusion.exhausted()
  }

  // Logged around the call rather than after it, since a turn that feels slow is
  // one model call taking its time rather than the loop doing work between them.
  private async askModel(turn: Turn, iteration: number): Promise<Outcome<ChatTurn>> {
    const askedAt = Date.now()
    const answer = await this.modelCaller.ask(this.requestFor(turn))
    if (answer.succeeded())
      EditEngine.logIteration(iteration, answer.value, turn.repository, Date.now() - askedAt)
    return answer
  }

  private requestFor(turn: Turn): ModelRequest {
    return new ModelRequest(
      turn.repository.targetNote(),
      turn.repository.skills(),
      turn.repository.agentMdChain(),
      this.sessionRepository.chatHistory(),
      turn.cancellation.signal(),
    )
  }

  private concludeCancelled(turn: Turn): Outcome<string> {
    return this.turnConclusion.cancelled(turn.repository.writtenNotes())
  }

  private concludeUtterance(turn: Turn, summary: string): Outcome<string> {
    return this.turnConclusion.utterance(
      summary,
      turn.repository.targetNote(),
      turn.repository.editEnd(),
    )
  }

  // The only record of why a turn spent its iterations: the panel shows commands
  // and answers, but not the edits the model retried or the note it aimed at.
  private static logIteration(
    iteration: number,
    turn: ChatTurn,
    turnRepository: TurnRepository,
    waitedMs: number,
  ): void {
    const calls = turn.isText() ? 'text' : turn.calls.map((call) => call.name).join(', ')
    const path = turnRepository.targetNote()?.path ?? 'no note'
    console.debug(`[owl] iteration ${iteration + 1} on ${path}: ${calls} (${waitedMs}ms)`)
  }

  private async executeToolCalls(
    toolCalls: ToolCall[],
    turn: Turn,
    refusals: RepeatedRefusal,
  ): Promise<void> {
    this.sessionRepository.appendChatMessage(ChatMessage.modelToolCalls(toolCalls))
    for (const call of toolCalls) {
      const toolCallOutcome = await turn.toolDispatcher.execute(call)
      this.sessionRepository.appendChatMessage(
        ChatMessage.toolCallResult(call.id, toolCallOutcome.result),
      )
      turn.repository.storeCursorPositionAndWrittenNote(toolCallOutcome.editEndPosition)
      refusals.record(toolCallOutcome.refusal ?? null)
    }
  }
}
