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
    return this.editTargetNote(call)
  }

  // Refused rather than applied to the note the turn still holds: that note is
  // no longer the target, and editing it would write to the wrong file.
  private editTargetNote(call: ToolCall): ToolCallOutcome {
    const unwritable = this.turnRepository.unwritableNote()
    if (unwritable)
      return { result: `${unwritable} is not editable yet; stop and tell the user to open it` }
    const note = this.turnRepository.targetNote()
    // Told rather than thrown, so the model reports it in the reply instead of
    // retrying an edit that cannot land.
    if (!note) return { result: 'no note is open; tell the user to open one before editing' }
    return this.callToolOnNote(call, note)
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
    const harnessResult = await this.harnessTools.execute(call, this.turnRepository.budget)
    if (harnessResult.answer)
      this.turnProgressPublisher.answered(harnessResult.answer.text, harnessResult.answer.sources)
    if (!harnessResult.effect) return { result: harnessResult.result }
    return { result: await this.publishCommand(harnessResult.effect) }
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
    if (resolvedNoteOutcome.hasFailed() || resolvedNoteOutcome.value === null) {
      this.turnRepository.cannotWriteTo(path)
      return false
    }
    this.turnRepository.retargetTo(resolvedNoteOutcome.value)
    this.turnProgressPublisher.retargeted(path)
    return true
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
