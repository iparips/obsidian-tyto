import { ToolCall } from '../model/providers/types'
import { OPEN_NOTE } from '../model/providers/models/tool-call'
import { ApplicableSkillsFactory } from './skill-gating/applicable-skills'
import { SkillDeclarationChecker } from './skill-gating/skill-declaration-checker'
import { SkillDeclarationOutcome } from './skill-gating/skill-declaration-outcome'
import { NoteEditTool } from './tools/note-edit-tool'
import { ToolCallOutcome } from './tool-call-outcome'
import { SkillRepository } from '../skills/skill-repository'
import { HarnessToolsService } from './tools/harness-tools-service'
import { HarnessResult } from './tools/harness-result'
import { HarnessResultKind } from './tools/harness-result-kind'
import { NoteOpenedByObsidianCommand } from '../commands/models/note-opened-by-obsidian-command'
import { TurnRepository } from './turn/turn-repository'
import { TargetNoteResolver } from './note-binding/target-note-resolver'
import { SessionRepository } from '../session/session-repository'
import { TurnProgressPublisher } from './turn-progress-publisher'
import { TurnCancellationController } from './turn/turn-cancellation-controller'
import { NoteChoiceService } from './waiting/note-choice-service'
import { NoteOpener } from './note-binding/note-opener'
import { UserQuestionService } from './waiting/user-question-service'
import { AnswerRequest } from './waiting/answer-request'
import { ModelAnswer } from './tools/model-answer'
import { ChoiceRequest } from './waiting/choice-request'
import { ProgressLine } from './progress-line'
import { TOOL_SCHEMAS } from './tools/tool-schemas'

// Long enough to carry any real tool name, short enough that a reasoning
// paragraph sent as one is cut rather than repeated into the history.
const NAME_ECHO_LIMIT = 40

const CANCELLED_RESULT = 'the user stopped the turn; this call did not run'
const SEARCH_OFF_RESULT = 'searching the vault is turned off in settings'
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
    private harnessToolsService: HarnessToolsService,
    private turnProgressPublisher: TurnProgressPublisher,
    private turnRepository: TurnRepository,
    private cancellationController: TurnCancellationController,
    private noteChoiceService: NoteChoiceService,
    private userQuestionService: UserQuestionService,
    // Absent in tests that exercise the guards rather than the opening, and in a
    // vault whose notes a command always opens.
    private noteOpener: NoteOpener | null = null,
  ) {}

  async execute(call: ToolCall): Promise<ToolCallOutcome> {
    // Between calls rather than inside one, so no edit is left half-applied.
    if (this.cancellationController.isCancelled()) return ToolCallOutcome.of(CANCELLED_RESULT)
    // Ahead of every branch below, since a name that is not offered is not a
    // load_skill either. Without it an unknown name fell through to the edit
    // tool and was refused by the parser, which is a second result in the batch
    // for the model to misread as an earlier edit.
    const unknownNameRefusal = this.refuseWhenNameIsNotOffered(call)
    if (unknownNameRefusal) return unknownNameRefusal
    if (call.isLoadSkill()) return ToolCallOutcome.of(await this.loadSkill(call))
    // Neither reaches the vault: both only read the call and act, so they are
    // handled here rather than round-tripping through the harness tools.
    if (call.isAskUser()) return this.askUser(AnswerRequest.from(call))
    if (call.isAnswerFromSearch()) return this.answerFromSearch(call)
    const skillsRefusal = this.refuseWhenDeclaredSkillsAreNotInSession(call)
    if (skillsRefusal) return skillsRefusal
    if (call.isHarnessTool()) return this.callHarnessTool(call)
    return this.recordEdit(call, await this.noteEditTool.execute(call))
  }

  // Checked against every name the catalogue defines rather than the set this
  // turn offers. A tool a disabled capability withheld is a real tool, and the
  // branches below refuse it by name and reason, which is what keeps the
  // schemas from being the only thing holding a disabled flow out of reach.
  private refuseWhenNameIsNotOffered(call: ToolCall): ToolCallOutcome | null {
    if (ToolDispatcher.definedToolNames().includes(call.name)) return null
    const reason = `no tool named ${ToolDispatcher.quotedName(call.name)}; the tools you may call are ${this.offeredToolNames().join(', ')}`
    this.turnProgressPublisher.publishProgressLineFn(ProgressLine.refusedByUnnamedTool(reason))
    return ToolCallOutcome.refused(reason)
  }

  // Quoted so the refusal says which call it stopped, and truncated because the
  // name is not always a name: the session that showed this sent a whole
  // paragraph of reasoning as one, and echoing it whole put that blob in the
  // history once per refusal.
  private static quotedName(name: string): string {
    const firstLine = name.split('\n')[0]
    if (firstLine.length <= NAME_ECHO_LIMIT) return `"${firstLine}"`
    return `"${firstLine.slice(0, NAME_ECHO_LIMIT)}..."`
  }

  private static definedToolNames(): string[] {
    return TOOL_SCHEMAS.map((schema) => schema.name)
  }

  // What this turn was actually sent, so the refusal lists the tools the model
  // can act on rather than every name the catalogue defines.
  private offeredToolNames(): string[] {
    return this.harnessToolsService
      .getToolCallSchemas(this.turnRepository.definesSkills())
      .map((schema) => schema.name)
  }

  private refuseWhenDeclaredSkillsAreNotInSession(call: ToolCall): ToolCallOutcome | null {
    if (!this.isSkillDeclarationRequired(call)) return null
    const refusal = this.checkDeclaredSkills(call).refusalOrNull()
    return refusal ? this.refuseDeclaration(call, refusal) : null
  }

  private isSkillDeclarationRequired(call: ToolCall): boolean {
    return call.requiresApplicableSkillsAttribute() && this.turnRepository.definesSkills()
  }

  private checkDeclaredSkills(call: ToolCall): SkillDeclarationOutcome {
    const checker = new SkillDeclarationChecker(
      this.turnRepository.skills(),
      this.turnRepository.skillNamesRead(),
    )
    return checker.check(ApplicableSkillsFactory.from(call))
  }

  // Published as a step, since a refusal the panel does not show reads as a
  // turn that stalled for no reason.
  private refuseDeclaration(call: ToolCall, reason: string): ToolCallOutcome {
    this.turnProgressPublisher.publishProgressLineFn(ProgressLine.refused(call.name, reason))
    return ToolCallOutcome.refused(reason)
  }

  // The edit tools are the ones a stuck turn retries, so the steps list has to
  // show them or a loop of failed anchors reads as a turn doing nothing.
  private recordEdit(call: ToolCall, outcome: ToolCallOutcome): ToolCallOutcome {
    if (outcome.editEndPosition) {
      this.turnProgressPublisher.publishProgressLineFn(
        ProgressLine.edited(
          outcome.descriptionForUser(),
          this.turnRepository.targetNote()?.path ?? null,
          outcome.wroteThrough === 'vault',
        ),
      )
      return outcome
    }
    this.turnProgressPublisher.publishProgressLineFn(
      ProgressLine.refused(call.name, outcome.result),
    )
    return outcome.asRefusal()
  }

  // Published once the body is in hand, so the panel names a skill the turn
  // actually followed rather than one the model asked for and did not get.
  private async loadSkill(call: ToolCall): Promise<string> {
    const name = call.argument('name')
    const skill = this.turnRepository.getSkillNamed(name)
    if (!skill) return `no skill named ${name} in this vault`
    // Its steps are already in this conversation, so a second read sends the
    // whole body again to say what the model was told once.
    if (this.turnRepository.hasLoaded(skill.name))
      return `you already loaded ${skill.name} in this session; follow the steps you were given`
    const body = await this.skillRepository.readBody(skill)
    if (body === null) return `skill ${skill.name} could not be read`
    this.turnRepository.recordSkillLoaded(skill.name)
    this.turnProgressPublisher.skillLoadedFn(skill.name)
    return body
  }

  // ToolCall that a model wants the harness to execute
  private async callHarnessTool(call: ToolCall): Promise<ToolCallOutcome> {
    const harnessResult: HarnessResult = await this.harnessToolsService.execute(
      call,
      this.turnRepository,
    )
    this.publishStepSummary(call, harnessResult)
    return this.handleToolResult(harnessResult)
  }

  // What the panel shows either way, so the handling below is only about what
  // this dispatcher does next. A refusing tool names its reason but not itself,
  // so the call it came from is attached here rather than at each of the many
  // places that build one.
  private publishStepSummary(call: ToolCall, harnessResult: HarnessResult): void {
    const step = harnessResult.publishStepSummary
    if (!step) return
    this.turnProgressPublisher.publishProgressLineFn(step.refused ? step.byTool(call.name) : step)
  }

  // Refused as well as absent from the schemas, so the offered tool list is
  // never the only thing keeping a disabled flow out of reach.
  private answerFromSearch(call: ToolCall): ToolCallOutcome {
    if (!this.harnessToolsService.hasSearchEnabled())
      return ToolCallOutcome.refused(SEARCH_OFF_RESULT)
    return this.publishModelAnswer(ModelAnswer.from(call))
  }

  // The answer reaches the panel and stops there: no tool can carry it into a
  // note, so the model is told to say nothing further about it (FR31).
  private publishModelAnswer(modelAnswer: ModelAnswer): ToolCallOutcome {
    this.turnProgressPublisher.publishModelAnswerFn(modelAnswer.text, modelAnswer.sources)
    return ToolCallOutcome.of('the answer reached the panel; say nothing further about it')
  }

  // Exhaustive over the kinds, so a tool added without a branch here fails to
  // compile rather than falling through and appearing to do nothing.
  private async handleToolResult(harnessResult: HarnessResult): Promise<ToolCallOutcome> {
    switch (harnessResult.kind) {
      case HarnessResultKind.Choice:
        return this.chooseNote(harnessResult.presentChoiceToUser)
      case HarnessResultKind.OpenNote:
        return this.openModelChosenNote(harnessResult.openNoteAtPath)
      case HarnessResultKind.ObsidianCommandRan:
        return this.runObsidianCommand(harnessResult.recordNoteOpenedByObsidianCommand)
      case HarnessResultKind.Text:
        return ToolDispatcher.outcomeOf(harnessResult)
    }
  }

  // A refused tool already published its step, so this only carries the reason
  // out to the loop that counts repeats.
  private static outcomeOf(harnessResult: HarnessResult): ToolCallOutcome {
    if (!harnessResult.publishStepSummary?.refused) return ToolCallOutcome.of(harnessResult.result)
    return ToolCallOutcome.refused(harnessResult.result)
  }

  // The answer is the tool result, so the model reads it in the same turn
  // rather than the user restating the instruction (FR15, FR16).
  private async askUser(request: AnswerRequest): Promise<ToolCallOutcome> {
    this.turnProgressPublisher.publishProgressLineFn(ProgressLine.asked(request.question))
    const answer = await this.userQuestionService.answerTo(request)
    return ToolCallOutcome.of(answer === '' ? NO_ANSWER_RESULT : `the user answered: ${answer}`)
  }

  // The pick is the tool result, so the model reads which note it may open
  // rather than inferring one from prose (FR4). A decline is a result too, not
  // an exception (FR6, NFR3).
  private async chooseNote(request: ChoiceRequest): Promise<ToolCallOutcome> {
    const chosen = await this.noteChoiceService.choose(request)
    if (chosen === null) return ToolCallOutcome.of(DECLINED_RESULT)
    return ToolCallOutcome.of(`the user chose ${chosen}; open it with open_note`)
  }

  // A refusal is a tool result, not an exception: the model reads that it was
  // refused and reports what stopped rather than claiming an edit (NFR1).
  private async openModelChosenNote(path: string): Promise<ToolCallOutcome> {
    if (!this.noteChoiceService.holds(path)) return this.refuseUnchosen(path)
    this.turnRepository.recordOpen(path)
    // Opened before the target moves, because retargeting resolves against an
    // editor: a note the user has never had on screen has none until this runs.
    await this.noteOpener?.open(path)
    this.turnProgressPublisher.publishProgressLineFn(ProgressLine.opened(path))
    const moved = await this.moveSessionTargetNoteTo(path)
    return ToolCallOutcome.of(
      moved ? `opened ${path}` : `opened ${path}, but it is not editable yet`,
    )
  }

  // Published as a step like every other refusal, so a turn stalled on it says
  // why rather than going quiet. Named apart from the seen-path refusal: a path
  // no search returned is a different mistake from one the user has not picked
  // (FR9, FR10).
  private refuseUnchosen(path: string): ToolCallOutcome {
    // Recorded, or the next edit lands on whatever note is still bound: a turn
    // refused here once wrote to the previous turn's note and reported success.
    this.turnRepository.cannotOpen(path)
    const reason = `${path} was not chosen by the user this turn; call choose_note with it now, then open it. Do not ask the user in prose`
    this.turnProgressPublisher.publishProgressLineFn(ProgressLine.refused(OPEN_NOTE, reason))
    return ToolCallOutcome.refused(reason)
  }

  // A command that opened nothing is refused rather than reported: it reads as a
  // success otherwise, and the counter that stops a loop never sees the repeat.
  private async runObsidianCommand(
    noteOpenedByObsidianCommand: NoteOpenedByObsidianCommand,
  ): Promise<ToolCallOutcome> {
    const result = await this.publishCommandAndUpdateSessionTargetNote(noteOpenedByObsidianCommand)
    if (noteOpenedByObsidianCommand.rebinds()) return ToolCallOutcome.of(result)
    return ToolCallOutcome.refused(result)
  }

  // The step goes up before the target moves, so the list reads in the order
  // things happened: the command ran, then the session followed the note it
  // opened. The model still reads the fuller text, which has to spell out that
  // the binding moved.
  private async publishCommandAndUpdateSessionTargetNote(
    noteOpenedByObsidianCommand: NoteOpenedByObsidianCommand,
  ): Promise<string> {
    this.turnProgressPublisher.publishProgressLineFn(
      ProgressLine.commandRan(noteOpenedByObsidianCommand.descriptionForUser()),
    )
    const moved = await this.moveTargetNote(noteOpenedByObsidianCommand.openedPath)
    return noteOpenedByObsidianCommand.descriptionForModel(moved)
  }

  // A command that opened nothing leaves the target where it was, which is not
  // a failure to move it.
  private async moveTargetNote(path: string | null): Promise<boolean> {
    if (path === null) return true
    return this.moveSessionTargetNoteTo(path)
  }

  // The target follows the note that opened even when it will not resolve:
  // the note it moved from is the one mobile just detached, so keeping it
  // strands the session on a note no retry can reach.
  private async moveSessionTargetNoteTo(path: string): Promise<boolean> {
    // Read before the bind, because the command runner awaits the open: Obsidian
    // fires file-open first, so followActiveNote has already bound and published
    // by the time this runs. Publishing again says the note changed twice.
    const alreadyBound = this.sessionRepository.targetNote() === path
    this.sessionRepository.bindTo(path)
    // Resolved for the path the tool opened, not the session's: the user moving
    // tabs while this runs rebinds the session, and reading it back would hand
    // the turn an editor showing the note they moved to.
    const maybeNote = await this.targetNoteResolver.resolveOrNothing(path)
    if (maybeNote === null) {
      this.turnRepository.cannotWriteTo(path)
      return false
    }
    this.turnRepository.retargetTo(maybeNote)
    if (!alreadyBound) this.turnProgressPublisher.retargetedFn(path, false)
    return true
  }
}
