import { EditorPosition } from 'obsidian'
import { ChatMessage, ChatProvider, ToolCall } from '../providers/types'
import { ChatTurn } from '../providers/models/chat-turn'
import { NoteEditor } from './note-editor'
import { Outcome, Outcomes } from '../shared/models/outcome'
import { PromptBuilder } from './prompt-builder'
import { OpenNote } from './models/open-note'
import { Skill } from '../skills/skill'
import { AgentsMdChain } from '../agents/agents-md-chain'
import { HarnessTools } from './harness-tools'
import { Turn } from './models/turn'
import { TurnFactory } from './turn-factory'
import { TurnRepository } from './turn-repository'
import { SessionRepository } from '../session/session-repository'
import { TurnProgressPublisher } from './turn-progress-publisher'

const MAX_ITERATIONS = 10

export class EditEngine {
  // Tail of the single-flight chain: resolves once every utterance queued so
  // far has settled. Seeded resolved so the first utterance starts immediately.
  private queue: Promise<unknown> = Promise.resolve()

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

  processUtterance(text: string): Promise<Outcome<string>> {
    const run = this.queue.then(() => this.runTurn(text))
    // caller needs rejection to propagate to display a failure message -> hence it's returned.
    // utterance queue needs failure swallowed so that consequent utterances don't get rejected
    this.queue = run.catch(() => undefined)
    return run
  }

  private async runTurn(text: string): Promise<Outcome<string>> {
    const turnOutcome = await this.turnFactory.openTurn()
    if (turnOutcome.hasFailed()) return Outcomes.failure(turnOutcome.step, turnOutcome.message)
    return this.runAgentLoop(turnOutcome.value, ChatMessage.user(text))
  }

  // The utterance is appended here rather than in runTurn, so it lands beside
  // the loop that reads it back as the tail of the chat history.
  private async runAgentLoop(turn: Turn, utterance: ChatMessage): Promise<Outcome<string>> {
    this.sessionRepository.appendChatMessage(utterance)
    const turnRepository = turn.repository
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const answer = await this.askModel(
        turnRepository.targetNote(),
        turnRepository.skills(),
        turnRepository.agentMdChain(),
        this.sessionRepository.chatHistory(),
      )
      if (answer.hasFailed()) return Outcomes.failure(answer.step, answer.message)
      EditEngine.logIteration(iteration, answer.value, EditEngine.pathOf(turnRepository))
      if (answer.value.isText())
        return this.concludeUtterance(
          answer.value.content,
          turnRepository.targetNote(),
          turnRepository.editEnd(),
        )
      await this.executeToolCalls(answer.value.calls, turn)
    }
    return Outcomes.failure('chat', `edit loop exceeded ${MAX_ITERATIONS} iterations`)
  }

  // The only record of why a turn spent its iterations: the panel shows commands
  // and answers, but not the edits the model retried or the note it aimed at.
  private static logIteration(iteration: number, turn: ChatTurn, path: string): void {
    const calls = turn.isText() ? 'text' : turn.calls.map((call) => call.name).join(', ')
    console.debug(`[owl] iteration ${iteration + 1} on ${path}:`, calls)
  }

  private static pathOf(turnRepository: TurnRepository): string {
    return turnRepository.targetNote()?.path ?? 'no note'
  }

  private askModel(
    note: OpenNote | null,
    skills: readonly Skill[],
    instructions: AgentsMdChain,
    chatHistory: readonly ChatMessage[],
  ) {
    const standingRules = PromptBuilder.standingRules(
      skills,
      instructions,
      this.harnessTools.allowedCommands(),
      this.harnessTools.offersSearch(),
    )
    // The chat history holds stale copies of the note from earlier turns, and
    // the model weights recent messages most heavily. So the note goes after it,
    // last of all: freshest content in the freshest position.
    const noteSnapshot = note
      ? PromptBuilder.noteSnapshot(note.details())
      : PromptBuilder.noNoteSnapshot(this.harnessTools.allowedCommands().length > 0)
    return this.modelProvider.complete(
      [standingRules, ...chatHistory, noteSnapshot],
      this.harnessTools.schemas(),
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

  private async executeToolCalls(toolCalls: ToolCall[], turn: Turn): Promise<void> {
    this.sessionRepository.appendChatMessage(ChatMessage.modelToolCalls(toolCalls))
    for (const call of toolCalls) {
      const toolCallOutcome = await turn.toolDispatcher.execute(call)
      this.sessionRepository.appendChatMessage(
        ChatMessage.toolCallResult(call.id, toolCallOutcome.result),
      )
      turn.repository.recordEdit(toolCallOutcome.editedTo)
    }
  }
}
