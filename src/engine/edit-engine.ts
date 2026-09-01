import { ChatMessage, ChatProvider, ToolCall } from '../providers/types'
import { EditApplier } from './edit-applier'
import { OperationParser } from './operation-parser'
import { Outcome, Outcomes } from './outcome'
import { NoteContext, PromptBuilder } from './prompt-builder'
import { TOOL_SCHEMAS } from './tool-schemas'
import { EditSession } from '../session/edit-session'
import { EMPTY_CATALOGUE, Skill, SkillCatalogue } from '../skills/skill-catalogue'

export interface OpenNote {
  context(): NoteContext
  applier: EditApplier
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
    if (!opened.ok) return opened
    const history = this.editSession.history
    history.push(ChatMessage.user(text))
    return this.runToolLoop(opened.value, history)
  }

  private async runToolLoop(note: OpenNote, history: ChatMessage[]): Promise<Outcome<string>> {
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const turn = await this.askModel(note, history)
      if (!turn.ok) return turn
      if (turn.value.isText()) return this.concludeUtterance(turn.value.content, note, history)
      await this.executeCalls(turn.value.calls, note, history)
    }
    return Outcomes.failure('chat', `edit loop exceeded ${MAX_ITERATIONS} iterations`)
  }

  private askModel(note: OpenNote, history: readonly ChatMessage[]) {
    const system = ChatMessage.system(PromptBuilder.build(note.context(), this.skills))
    return this.modelProvider.complete([system, ...history], TOOL_SCHEMAS)
  }

  private concludeUtterance(
    summary: string,
    note: OpenNote,
    history: ChatMessage[],
  ): Outcome<string> {
    history.push(ChatMessage.assistant(summary))
    note.applier.focusLastEdit()
    return Outcomes.success(summary)
  }

  private async executeCalls(
    calls: ToolCall[],
    note: OpenNote,
    history: ChatMessage[],
  ): Promise<void> {
    history.push(ChatMessage.assistantToolCalls(calls))
    for (const call of calls) history.push(await this.executeCall(call, note))
  }

  private async executeCall(call: ToolCall, note: OpenNote): Promise<ChatMessage> {
    const result =
      call.name === 'load_skill' ? await this.loadSkill(call.args) : this.applyParsed(call, note)
    return ChatMessage.toolResult(call.id, result)
  }

  private applyParsed(call: ToolCall, note: OpenNote): string {
    const parsed = OperationParser.parse(call)
    if ('error' in parsed) return `invalid arguments: ${parsed.error}`
    return this.applyOperation(parsed.op, note)
  }

  private async loadSkill(args: Record<string, unknown>): Promise<string> {
    const skill = this.skills.find((candidate) => candidate.name === args.name)
    if (!skill) return `no skill named ${String(args.name)} in this vault`
    const body = await this.readSkillBody(skill)
    return body ?? `skill ${skill.name} could not be read`
  }

  private applyOperation(op: Parameters<EditApplier['apply']>[0], note: OpenNote): string {
    const result = note.applier.apply(op)
    if (result.applied) {
      this.editSession.operationLog.push(op)
      return 'applied'
    }
    if (result.reason === 'noMatch') return 'anchor not found in note'
    return 'anchor matches multiple places; use a longer anchor'
  }
}
