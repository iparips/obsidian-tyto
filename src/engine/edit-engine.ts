import { ChatMessage, ChatProvider, ToolCall } from '../providers/types'
import { EditApplier, EditOperation } from './edit-applier'
import { NoteOperationParser } from './note-operation-parser'
import { Outcome, Outcomes } from './outcome'
import { NoteContext } from './note-context'
import { PromptBuilder } from './prompt-builder'
import { TOOL_SCHEMAS } from './tool-schemas'
import { EditSession } from '../session/edit-session'
import { EMPTY_CATALOGUE, Skill, SkillCatalogue } from '../skills/skill-catalogue'

export class OpenNote {
  constructor(
    readonly applier: EditApplier,
    private readonly readContext: () => NoteContext,
  ) {}

  context(): NoteContext {
    return this.readContext()
  }
}

export interface NoteAccess {
  open(): Outcome<OpenNote>
}

export type SkillBodyReader = (skill: Skill) => Promise<string | null>

const MAX_ITERATIONS = 6

export class EditEngine {
  // Tail of the single-flight chain: resolves once every utterance queued so
  // far has settled. Seeded resolved so the first utterance starts immediately.
  private queue: Promise<unknown> = Promise.resolve()

  constructor(
    private modelProvider: ChatProvider,
    private editSession: EditSession,
    private noteAccess: NoteAccess,
    private skills: SkillCatalogue = EMPTY_CATALOGUE,
    private readSkillBody: SkillBodyReader = async () => null,
  ) {}

  processUtterance(text: string): Promise<Outcome<string>> {
    const run = this.queue.then(() => this.runTurn(text))
    // caller needs rejection to propagate to display a failure message -> hence it's returned.
    // utterance queue needs failure swallowed so that consequent utterances don't get rejected
    this.queue = run.catch(() => undefined)
    return run
  }

  private async runTurn(text: string): Promise<Outcome<string>> {
    const opened = this.noteAccess.open()
    if (opened.hasFailed()) return Outcomes.failure(opened.step, opened.message)
    const history = this.editSession.history
    history.push(ChatMessage.user(text))
    return this.runToolLoop(opened.value, history)
  }

  private async runToolLoop(note: OpenNote, history: ChatMessage[]): Promise<Outcome<string>> {
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const turn = await this.askModel(note, history)
      if (turn.hasFailed()) return Outcomes.failure(turn.step, turn.message)
      if (turn.value.isText()) return this.concludeUtterance(turn.value.content, note, history)
      await this.executeToolCalls(turn.value.calls, note, history)
    }
    return Outcomes.failure('chat', `edit loop exceeded ${MAX_ITERATIONS} iterations`)
  }

  // The note goes last, not in the system message: history holds snapshots from
  // earlier turns, and the model weights the most recent message most heavily.
  // Freshest content in the freshest position.
  private askModel(note: OpenNote, history: readonly ChatMessage[]) {
    const system = ChatMessage.system(PromptBuilder.build(note.context(), this.skills))
    const current = ChatMessage.system(PromptBuilder.context(note.context()))
    return this.modelProvider.complete([system, ...history, current], TOOL_SCHEMAS)
  }

  private concludeUtterance(
    summary: string,
    note: OpenNote,
    history: ChatMessage[],
  ): Outcome<string> {
    history.push(ChatMessage.model(summary))
    note.applier.focusLastEdit()
    return Outcomes.success(summary)
  }

  private async executeToolCalls(
    calls: ToolCall[],
    note: OpenNote,
    history: ChatMessage[],
  ): Promise<void> {
    history.push(ChatMessage.modelToolCalls(calls))
    for (const call of calls) history.push(await this.executeToolCall(call, note))
  }

  private async executeToolCall(call: ToolCall, note: OpenNote): Promise<ChatMessage> {
    const result = call.isLoadSkill() ? await this.loadSkill(call) : this.callToolOnNote(call, note)
    return ChatMessage.toolCallResult(call.id, result)
  }

  private callToolOnNote(call: ToolCall, note: OpenNote): string {
    const parsed = NoteOperationParser.parse(call)
    if (parsed.hasFailed()) return `invalid arguments: ${parsed.message}`
    return this.doCallToolOnNote(parsed.value, note)
  }

  private async loadSkill(call: ToolCall): Promise<string> {
    const name = call.argument('name')
    const skill = this.skills.find((candidate) => candidate.name === name)
    if (!skill) return `no skill named ${name} in this vault`
    const body = await this.readSkillBody(skill)
    return body ?? `skill ${skill.name} could not be read`
  }

  private doCallToolOnNote(op: EditOperation, note: OpenNote): string {
    const result = note.applier.apply(op)
    if (result.applied) {
      this.editSession.operationLog.push(op)
      return 'applied'
    }
    if (result.reason === 'noMatch') return 'anchor not found in note'
    return 'anchor matches multiple places; use a longer anchor'
  }
}
