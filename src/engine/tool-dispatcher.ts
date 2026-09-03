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
import { NoteChoice } from './note-choice'
import { NoteOpener } from './note-opener'
import { UserQuestion } from './user-question'
import { AnswerRequest } from './models/answer-request'
import { ChoiceRequest } from './models/choice-request'
import { TurnStep } from './models/turn-step'

const CANCELLED_RESULT = 'the user stopped the turn; this call did not run'
const NO_ANSWER_RESULT = 'the user did not answer; stop and say what you were waiting on'
// The decline names the next move: a model told only "declined" searches again,
// which is the loop this replaces (FR7).
const DECLINED_RESULT =
  'the user declined every note offered; ask them what they meant rather than searching again'

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
    private noteChoice: NoteChoice,
    private userQuestion: UserQuestion,
    // Absent in tests that exercise the guards rather than the opening, and in a
    // vault whose notes a command always opens.
    private noteOpener: NoteOpener | null = null,
  ) {}

  async execute(call: ToolCall): Promise<ToolCallOutcome> {
    // Between calls rather than inside one, so no edit is left half-applied.
    if (this.turnCancellation.isCancelled()) return { result: CANCELLED_RESULT }
    if (call.isLoadSkill()) return { result: await this.loadSkill(call) }
    if (call.isNoSkillApplies()) return { result: this.noSkillApplies(call) }
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
    this.turnRepository.settleSkills()
    this.turnProgressPublisher.skillLoaded(skill.name)
    return body
  }

  // The model's own judgement, recorded rather than checked: the harness never
  // decides which skill fits, only that the question was answered before a
  // write.
  private noSkillApplies(call: ToolCall): string {
    this.turnRepository.settleSkills()
    this.turnProgressPublisher.stepTaken(TurnStep.noSkillApplies(call.argument('reason')))
    return 'noted; no skill applies to this turn'
  }

  private async callHarnessTool(call: ToolCall): Promise<ToolCallOutcome> {
    const harnessResult = await this.harnessTools.execute(call, this.turnRepository)
    if (harnessResult.step) this.turnProgressPublisher.stepTaken(harnessResult.step)
    if (harnessResult.answer)
      this.turnProgressPublisher.answered(harnessResult.answer.text, harnessResult.answer.sources)
    if (harnessResult.question) return this.askUser(harnessResult.question)
    if (harnessResult.choice) return this.chooseNote(harnessResult.choice)
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

  // The pick is the tool result, so the model reads which note it may open
  // rather than inferring one from prose (FR4). A decline is a result too, not
  // an exception (FR6, NFR3).
  private async chooseNote(request: ChoiceRequest): Promise<ToolCallOutcome> {
    const chosen = await this.noteChoice.choose(request)
    if (chosen === null) return { result: DECLINED_RESULT }
    return { result: `the user chose ${chosen}; open it with open_note` }
  }

  // A refusal is a tool result, not an exception: the model reads that it was
  // refused and reports what stopped rather than claiming an edit (NFR1).
  private async openModelChosenNote(path: string): Promise<ToolCallOutcome> {
    if (!this.noteChoice.holds(path)) return this.refuseUnchosen(path)
    this.turnRepository.recordOpen(path)
    // Opened before the target moves, because retargeting resolves against an
    // editor: a note the user has never had on screen has none until this runs.
    await this.noteOpener?.open(path)
    this.turnProgressPublisher.stepTaken(TurnStep.opened(path))
    const moved = await this.moveTargetTo(path)
    return { result: moved ? `opened ${path}` : `opened ${path}, but it is not editable yet` }
  }

  // Published as a step like every other refusal, so a turn stalled on it says
  // why rather than going quiet. Named apart from the seen-path refusal: a path
  // no search returned is a different mistake from one the user has not picked
  // (FR9, FR10).
  private refuseUnchosen(path: string): ToolCallOutcome {
    const reason = `${path} was not chosen by the user this turn; call choose_note with it now, then open it. Do not ask the user in prose`
    this.turnProgressPublisher.stepTaken(TurnStep.refused(reason))
    return { result: reason }
  }

  // The step goes up before the target moves, so the list reads in the order
  // things happened: the command ran, then the session followed the note it
  // opened. The model still reads the fuller text, which has to spell out that
  // the binding moved.
  private async publishCommand(effect: CommandEffect): Promise<string> {
    this.turnProgressPublisher.stepTaken(TurnStep.commandRan(effect.stepDetail()))
    const moved = await this.moveTarget(effect)
    return moved ? effect.describe() : effect.describeUneditable()
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
    // The note is live here: it resolved to an editor just now, rather than
    // from a path the session carried in. A command's own note is authorised by
    // the allow-list, so this covers both routes onto a note.
    this.turnRepository.recordOpened(path)
    this.turnProgressPublisher.retargeted(path)
    return true
  }
}
