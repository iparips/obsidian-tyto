import { ChatMessage, ChatProvider, ToolCall } from '../providers/types'
import { EditApplier } from './edit-applier'
import { OperationParser } from './operation-parser'
import { Outcome, Outcomes } from './outcome'
import { NoteContext, PromptBuilder } from './prompt-builder'
import { TOOL_SCHEMAS } from './tool-schemas'
import { EditSession } from '../session/edit-session'
import { EMPTY_CATALOGUE, SkillCatalogue } from '../skills/skill-catalogue'

export interface OpenNote {
  context(): NoteContext
  applier: EditApplier
}

export interface NoteAccess {
  open(): Outcome<OpenNote>
}

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
    this.editSession.history.push({ role: 'user', content: text })
    return this.runToolLoop(opened.value)
  }

  private async runToolLoop(note: OpenNote): Promise<Outcome<string>> {
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const turn = await this.askModel(note, this.editSession.history)
      if (!turn.ok) return turn
      if (turn.value.kind === 'text') return this.concludeUtterance(turn.value.content, note)
      this.executeCalls(turn.value.calls, note)
    }
    return Outcomes.failure('chat', `edit loop exceeded ${MAX_ITERATIONS} iterations`)
  }

  private askModel(note: OpenNote, history: readonly ChatMessage[]) {
    const system: ChatMessage = {
      role: 'system',
      content: PromptBuilder.build(note.context(), this.skills),
    }
    return this.modelProvider.complete([system, ...history], TOOL_SCHEMAS)
  }

  private concludeUtterance(summary: string, note: OpenNote): Outcome<string> {
    this.editSession.history.push({ role: 'assistant', content: summary })
    note.applier.focusLastEdit()
    return Outcomes.success(summary)
  }

  private executeCalls(calls: ToolCall[], note: OpenNote): void {
    this.editSession.history.push({ role: 'assistant', toolCalls: calls })
    calls.forEach((call) => this.executeCall(call, note))
  }

  private executeCall(call: ToolCall, note: OpenNote): void {
    const parsed = OperationParser.parse(call)
    const result =
      'error' in parsed
        ? `invalid arguments: ${parsed.error}`
        : this.applyOperation(parsed.op, note)
    this.editSession.history.push({ role: 'tool', toolCallId: call.id, content: result })
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
