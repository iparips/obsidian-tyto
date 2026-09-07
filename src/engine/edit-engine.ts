import { EditorPosition } from 'obsidian'
import { ChatMessage, ChatProvider, ToolCall } from '../providers/types'
import { ChatTurn } from '../providers/models/chat-turn'
import { NoteEditor } from './note-editing/note-editor'
import { Cancelled, Failure, Outcome, Outcomes } from '../shared/models/outcome'
import { PromptBuilder } from './prompting/prompt-builder'
import { OpenNote } from './note-editing/open-note'
import { Skill } from '../skills/skill'
import { AgentsMdChain } from '../agents/agents-md-chain'
import { HarnessTools } from './tools/harness-tools'
import { Turn } from './turn/turn'
import { TurnFactory } from './turn/turn-factory'
import { TurnRepository } from './turn/turn-repository'
import { SessionRepository } from '../session/session-repository'
import { TurnProgressPublisher } from './turn-progress-publisher'
import { Today } from './prompting/today'
import { IterationBudget } from './turn/iteration-budget'
import { RepeatedRefusal } from './turn/repeated-refusal'

export class EditEngine {
  // Tail of the single-flight chain: resolves once every utterance queued so
  // far has settled. Seeded resolved so the first utterance starts immediately.
  private queue: Promise<unknown> = Promise.resolve()
  // Null between turns, so a cancel arriving after one finished reaches nothing.
  private runningTurn: Turn | null = null

  constructor(
    private modelProvider: ChatProvider,
    private sessionRepository: SessionRepository,
    private noteEditor: NoteEditor,
    private harnessTools: HarnessTools,
    private turnFactory: TurnFactory,
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
    const run = this.queue.then(() => this.runTurn(text))
    // caller needs rejection to propagate to display a failure message -> hence it's returned.
    // utterance queue needs failure swallowed so that consequent utterances don't get rejected
    this.queue = run.catch(() => undefined)
    return run
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
    const turnRepository = turn.repository
    const iterationBudget = new IterationBudget()
    const repeatedRefusal = new RepeatedRefusal()
    for (let iteration = 0; !iterationBudget.isSpent(); iteration++) {
      if (turn.cancellation.isCancelled()) return this.concludeCancelled(turn)
      const askedAt = Date.now()
      // build prompt, and send it to model
      const modelAnswer = await this.askModel(
        turnRepository.targetNote(),
        turnRepository.skills(),
        turnRepository.agentMdChain(),
        this.sessionRepository.chatHistory(),
        turn.cancellation.signal(),
      )
      if (!modelAnswer.succeeded()) return this.concludeUnfinished(modelAnswer, turn)
      EditEngine.logIteration(
        iteration,
        modelAnswer.value,
        EditEngine.pathOf(turnRepository),
        Date.now() - askedAt,
      )
      if (modelAnswer.value.isText())
        return this.concludeUtterance(
          modelAnswer.value.content,
          turnRepository.targetNote(),
          turnRepository.editEnd(),
        )
      await this.executeToolCalls(modelAnswer.value.calls, turn, repeatedRefusal)

      if (repeatedRefusal.isStuck()) return EditEngine.concludeStuck(repeatedRefusal)
      iterationBudget.spend(modelAnswer.value.calls.length)

      if (iterationBudget.justRanLow())
        this.turnProgressPublisher.runningLow(iterationBudget.warning())
    }
    return EditEngine.concludeExhausted()
  }

  // Ends the turn on the reason itself, since a model refused the same way
  // twice will spend every remaining step being refused a third way.
  private static concludeStuck(refusals: RepeatedRefusal): Outcome<string> {
    return Outcomes.failure('chat', refusals.message())
  }

  // Points at the steps list rather than repeating it: every step is numbered
  // there, so where the turn went is already on screen.
  private static concludeExhausted(): Outcome<string> {
    return Outcomes.failure(
      'chat',
      `Owl ran out of steps for this turn after ${IterationBudget.max()}. The steps list shows where they went. Try a smaller instruction, or say which note to use.`,
    )
  }

  // An aborted request is the user's cancel arriving mid-flight, so the turn
  // ends the way a cancel between calls does rather than as a chat failure.
  private concludeUnfinished(
    answer: Failure<ChatTurn> | Cancelled<ChatTurn>,
    turn: Turn,
  ): Outcome<string> {
    if (answer.hasFailed()) return Outcomes.failure(answer.step, answer.message)
    return this.concludeCancelled(turn)
  }

  // The history keeps the fact rather than the partial results, so the next turn
  // knows the work stopped without being invited to resume it.
  private concludeCancelled(turn: Turn): Outcome<string> {
    const written = turn.repository.writtenNotes()
    this.sessionRepository.appendChatMessage(ChatMessage.model(EditEngine.cancelledNote(written)))
    return Outcomes.cancelled('chat', written)
  }

  private static cancelledNote(written: readonly string[]): string {
    if (written.length === 0) return 'The user stopped this turn. Nothing was changed.'
    return `The user stopped this turn. Already changed: ${written.join(', ')}.`
  }

  // The only record of why a turn spent its iterations: the panel shows commands
  // and answers, but not the edits the model retried or the note it aimed at.
  // The wait is logged with them, since a turn that feels slow is one model call
  // taking its time rather than the loop doing work between them.
  private static logIteration(
    iteration: number,
    turn: ChatTurn,
    path: string,
    waitedMs: number,
  ): void {
    const calls = turn.isText() ? 'text' : turn.calls.map((call) => call.name).join(', ')
    console.debug(`[owl] iteration ${iteration + 1} on ${path}: ${calls} (${waitedMs}ms)`)
  }

  private static pathOf(turnRepository: TurnRepository): string {
    return turnRepository.targetNote()?.path ?? 'no note'
  }

  private askModel(
    note: OpenNote | null,
    skills: readonly Skill[],
    agentsMdChain: AgentsMdChain,
    chatHistory: readonly ChatMessage[],
    abortSignal: AbortSignal,
  ) {
    const standingRules = PromptBuilder.standingRules(
      skills,
      agentsMdChain,
      this.harnessTools.allowedCommands(),
      this.harnessTools.hasSearchEnabled(),
    )
    // Ordered by how stale a copy the history could hold: the rules first, then
    // the conversation, then what the model must not read off an earlier turn.
    // Today is read per iteration rather than per session, so a turn running
    // past midnight resolves against the day it is on.
    return this.modelProvider.complete(
      [
        standingRules,
        ...chatHistory,
        PromptBuilder.dateAndSkills(Today.of(), skills),
        note
          ? PromptBuilder.noteContext(note.details())
          : PromptBuilder.unboundContext(
              this.harnessTools.hasWhitelistedCommands(),
              this.harnessTools.hasSearchEnabled(),
            ),
      ],
      this.harnessTools.schemas(skills.length > 0),
      abortSignal,
    )
  }

  private concludeUtterance(
    summary: string,
    note: OpenNote | null,
    lastEditEnd: EditorPosition | null,
  ): Outcome<string> {
    this.sessionRepository.appendChatMessage(ChatMessage.model(summary))
    if (note && lastEditEnd) this.noteEditor.focusEdit(note.editor, lastEditEnd)
    return Outcomes.success(summary)
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
