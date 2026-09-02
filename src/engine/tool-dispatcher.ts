import { ToolCall } from '../providers/types'
import { EditorPosition } from 'obsidian'
import { NoteEditor, EditOperation } from './note-editor'
import { NoteOperationParser } from './note-operation-parser'
import { OpenNote } from './models/open-note'
import { SkillRepository } from '../skills/skill-repository'
import { HarnessTools } from './harness-tools'
import { CommandEffect } from '../commands/models/command-effect'
import { TurnRepository } from './turn-repository'
import { TargetNoteResolver } from './target-note-resolver'
import { SessionRepository } from '../session/session-repository'
import { TurnProgressPublisher } from './turn-progress-publisher'

// editedTo is absent when the call changed nothing, so the turn keeps the
// position of the last call that did.
export interface ToolCallOutcome {
  result: string
  editedTo?: EditorPosition
}

// One tool call, run and published. The loop owns the conversation; this owns
// what a call does to the note, the session and the panel.
export class ToolDispatcher {
  constructor(
    private sessionRepository: SessionRepository,
    private targetNoteResolver: TargetNoteResolver,
    private skillRepository: SkillRepository,
    private noteEditor: NoteEditor,
    private harnessTools: HarnessTools,
    private turnProgressPublisher: TurnProgressPublisher,
    private turnRepository: TurnRepository,
  ) {}

  async execute(call: ToolCall): Promise<ToolCallOutcome> {
    if (call.isLoadSkill()) return { result: await this.loadSkill(call) }
    if (call.isHarnessTool()) return this.callHarnessTool(call)
    return this.callToolOnNote(call, this.turnRepository.targetNote())
  }

  private async loadSkill(call: ToolCall): Promise<string> {
    const name = call.argument('name')
    const skill = this.turnRepository.skillNamed(name)
    if (!skill) return `no skill named ${name} in this vault`
    const body = await this.skillRepository.readBody(skill)
    return body ?? `skill ${skill.name} could not be read`
  }

  private async callHarnessTool(call: ToolCall): Promise<ToolCallOutcome> {
    const harnessResult = await this.harnessTools.execute(call, this.turnRepository.budget)
    if (harnessResult.answer)
      this.turnProgressPublisher.answered(harnessResult.answer.text, harnessResult.answer.sources)
    if (!harnessResult.effect) return { result: harnessResult.result }
    return { result: await this.publishCommand(harnessResult.effect) }
  }

  // The model is told what actually happened: a note that opened but has no
  // editor did not move the target, so the next anchor must not assume it did.
  private async publishCommand(effect: CommandEffect): Promise<string> {
    const moved = await this.moveTarget(effect)
    const text = moved
      ? effect.describe()
      : CommandEffect.openedNothing(effect.commandName).describe()
    this.turnProgressPublisher.commandRan(text)
    return text
  }

  private async moveTarget(effect: CommandEffect): Promise<boolean> {
    const opened = effect.openedPath
    if (opened === null) return true
    return this.moveTargetTo(opened)
  }

  // The target moves only once the turn can resolve it, so a note nothing has
  // open leaves the session pointing where it was.
  private async moveTargetTo(path: string): Promise<boolean> {
    const wasTargeting = this.sessionRepository.targetNote()
    this.sessionRepository.changeTargetNote(path)
    const resolvedNoteOutcome = await this.targetNoteResolver.resolve()
    if (resolvedNoteOutcome.hasFailed()) return this.abandonMove(wasTargeting)
    this.turnRepository.retargetTo(resolvedNoteOutcome.value)
    this.turnProgressPublisher.retargeted(path)
    return true
  }

  private abandonMove(wasTargeting: string): boolean {
    this.sessionRepository.changeTargetNote(wasTargeting)
    return false
  }

  private callToolOnNote(call: ToolCall, note: OpenNote): ToolCallOutcome {
    const parsed = NoteOperationParser.parse(call)
    if (parsed.hasFailed()) return { result: `invalid arguments: ${parsed.message}` }
    return this.applyOperation(parsed.value, note)
  }

  private applyOperation(op: EditOperation, note: OpenNote): ToolCallOutcome {
    const result = this.noteEditor.apply(note.editor, note.details(), op)
    if (result.applied) return { result: 'applied', editedTo: result.endedAt }
    if (result.reason === 'noMatch') return { result: 'anchor not found in note' }
    return { result: 'anchor matches multiple places; use a longer anchor' }
  }
}
