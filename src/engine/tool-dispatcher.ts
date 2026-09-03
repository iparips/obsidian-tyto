import { ToolCall } from '../providers/types'
import { NoteEditTool } from './note-edit-tool'
import { ToolCallOutcome } from './models/tool-call-outcome'
import { SkillRepository } from '../skills/skill-repository'
import { HarnessTools } from './harness-tools'
import { CommandEffect } from '../commands/models/command-effect'
import { TurnRepository } from './turn-repository'
import { TargetNoteResolver } from './target-note-resolver'
import { SessionRepository } from '../session/session-repository'
import { TurnProgressPublisher } from './turn-progress-publisher'
import { TurnCancellation } from './turn-cancellation'
import { OpenApproval } from './open-approval'
import { UserQuestion } from './user-question'
import { AnswerRequest } from './models/answer-request'
import { TurnStep } from './models/turn-step'

const CANCELLED_RESULT = 'the user stopped the turn; this call did not run'
const NO_ANSWER_RESULT = 'the user did not answer; stop and say what you were waiting on'
const DECLINED_RESULT =
  'the user declined that note; the session did not move and nothing was written'

// One tool call, run and published. The loop owns the conversation; this owns
// what a call does to the note, the session and the panel.
export class ToolDispatcher {
  constructor(
    private sessionRepository: SessionRepository,
    private targetNoteResolver: TargetNoteResolver,
    private skillRepository: SkillRepository,
    private noteEditTool: NoteEditTool,
    private harnessTools: HarnessTools,
    private turnProgressPublisher: TurnProgressPublisher,
    private turnRepository: TurnRepository,
    private turnCancellation: TurnCancellation,
    private openApproval: OpenApproval,
    private userQuestion: UserQuestion,
  ) {}

  async execute(call: ToolCall): Promise<ToolCallOutcome> {
    // Between calls rather than inside one, so no edit is left half-applied.
    if (this.turnCancellation.isCancelled()) return { result: CANCELLED_RESULT }
    if (call.isLoadSkill()) return { result: await this.loadSkill(call) }
    if (call.isHarnessTool()) return this.callHarnessTool(call)
    return this.publishEdit(this.noteEditTool.execute(call))
  }

  // The edit tools are the ones a stuck turn retries, so the steps list has to
  // show them or a loop of failed anchors reads as a turn doing nothing.
  private publishEdit(outcome: ToolCallOutcome): ToolCallOutcome {
    const step = outcome.editedTo
      ? TurnStep.edited(outcome.result)
      : TurnStep.refused(outcome.result)
    this.turnProgressPublisher.stepTaken(step)
    return outcome
  }

  // Published once the body is in hand, so the panel names a skill the turn
  // actually followed rather than one the model asked for and did not get.
  private async loadSkill(call: ToolCall): Promise<string> {
    const name = call.argument('name')
    const skill = this.turnRepository.skillNamed(name)
    if (!skill) return `no skill named ${name} in this vault`
    const body = await this.skillRepository.readBody(skill)
    if (body === null) return `skill ${skill.name} could not be read`
    this.turnProgressPublisher.skillLoaded(skill.name)
    return body
  }

  private async callHarnessTool(call: ToolCall): Promise<ToolCallOutcome> {
    const harnessResult = await this.harnessTools.execute(call, this.turnRepository)
    if (harnessResult.step) this.turnProgressPublisher.stepTaken(harnessResult.step)
    if (harnessResult.answer)
      this.turnProgressPublisher.answered(harnessResult.answer.text, harnessResult.answer.sources)
    if (harnessResult.question) return this.askUser(harnessResult.question)
    if (harnessResult.openPath) return this.openModelChosenNote(harnessResult.openPath)
    if (!harnessResult.effect) return { result: harnessResult.result }
    return { result: await this.publishCommand(harnessResult.effect) }
  }

  // The answer is the tool result, so the model reads it in the same turn
  // rather than the user restating the instruction (FR15, FR16).
  private async askUser(request: AnswerRequest): Promise<ToolCallOutcome> {
    this.turnProgressPublisher.stepTaken(TurnStep.asked(request.question))
    const answer = await this.userQuestion.answerTo(request)
    return { result: answer === '' ? NO_ANSWER_RESULT : `the user answered: ${answer}` }
  }

  // A decline is a tool result, not an exception: the model reads that it was
  // refused and reports what stopped rather than claiming an edit (FR7, NFR1).
  private async openModelChosenNote(path: string): Promise<ToolCallOutcome> {
    if (!(await this.openApproval.grantFor(path))) return { result: DECLINED_RESULT }
    this.turnRepository.recordOpen(path)
    this.turnProgressPublisher.stepTaken(TurnStep.opened(path))
    const moved = await this.moveTargetTo(path)
    return { result: moved ? `opened ${path}` : `opened ${path}, but it is not editable yet` }
  }

  // The model is told what actually happened: a note that opened without an
  // editor is the target, but cannot be written to yet.
  private async publishCommand(effect: CommandEffect): Promise<string> {
    const moved = await this.moveTarget(effect)
    const text = moved ? effect.describe() : effect.describeUneditable()
    this.turnProgressPublisher.commandRan(text)
    return text
  }

  private async moveTarget(effect: CommandEffect): Promise<boolean> {
    const opened = effect.openedPath
    if (opened === null) return true
    return this.moveTargetTo(opened)
  }

  // The target follows the note that opened even when it will not resolve:
  // the note it moved from is the one mobile just detached, so keeping it
  // strands the session on a note no retry can reach.
  private async moveTargetTo(path: string): Promise<boolean> {
    this.sessionRepository.changeTargetNote(path)
    const resolvedNoteOutcome = await this.targetNoteResolver.resolve()
    if (!resolvedNoteOutcome.succeeded() || resolvedNoteOutcome.value === null) {
      this.turnRepository.cannotWriteTo(path)
      return false
    }
    this.turnRepository.retargetTo(resolvedNoteOutcome.value)
    this.turnProgressPublisher.retargeted(path)
    return true
  }
}
