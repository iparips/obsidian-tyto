import { EditorPosition } from 'obsidian'
import { ChatMessage, ChatProvider, ToolCall } from '../providers/types'
import { NoteEditor, EditOperation } from './note-editor'
import { NoteOperationParser } from './note-operation-parser'
import { Outcome, Outcomes } from '../shared/models/outcome'
import { PromptBuilder } from './prompt-builder'
import { TOOL_SCHEMAS } from './models/tool-schemas'
import { AgentSession } from './models/agent-session'
import { WorkspaceNoteLocator } from './workspace-note-locator'
import { OpenNote } from './models/open-note'
import { Skill } from '../skills/skill'
import { SkillRepository } from '../skills/skill-repository'
import { AgentsMdChain } from '../agents/agents-md-chain'
import { AgentsMdRepository } from '../agents/agents-md-repository'

// editedTo is absent when the call changed nothing, so the turn keeps the
// position of the last call that did.
interface ToolCallOutcome {
  result: string
  editedTo?: EditorPosition
}

const MAX_ITERATIONS = 6

export class EditEngine {
  // Tail of the single-flight chain: resolves once every utterance queued so
  // far has settled. Seeded resolved so the first utterance starts immediately.
  private queue: Promise<unknown> = Promise.resolve()

  constructor(
    private modelProvider: ChatProvider,
    private agentSession: AgentSession,
    private skillRepository: SkillRepository,
    private agentsMdRepository: AgentsMdRepository,
    private noteLocator: WorkspaceNoteLocator,
    private noteEditor: NoteEditor,
    private reportInstructions: (chain: AgentsMdChain) => void,
  ) {}

  processUtterance(text: string): Promise<Outcome<string>> {
    const run = this.queue.then(() => this.runTurn(text))
    // caller needs rejection to propagate to display a failure message -> hence it's returned.
    // utterance queue needs failure swallowed so that consequent utterances don't get rejected
    this.queue = run.catch(() => undefined)
    return run
  }

  private async runTurn(text: string): Promise<Outcome<string>> {
    const located = this.noteLocator.locate()
    if (located.hasFailed()) return Outcomes.failure(located.step, located.message)
    const history = this.agentSession.chatHistory
    history.push(ChatMessage.user(text))
    const skills = await this.skillRepository.listSkills()
    const instructions = await this.resolveInstructions(located.value)
    return this.runAgentLoop(located.value, history, skills, instructions)
  }

  // Resolved from the note this turn writes to, not from the session, and
  // passed down rather than held, so no chain reaches another target (FR8, FR13).
  private async resolveInstructions(note: OpenNote): Promise<AgentsMdChain> {
    const chain = await this.agentsMdRepository.resolveFor(note.path)
    this.reportInstructions(chain)
    return chain
  }

  private async runAgentLoop(
    note: OpenNote,
    history: ChatMessage[],
    skills: readonly Skill[],
    instructions: AgentsMdChain,
  ): Promise<Outcome<string>> {
    let lastEditEnd: EditorPosition | null = null
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const turn = await this.askModel(note, history, skills, instructions)
      if (turn.hasFailed()) return Outcomes.failure(turn.step, turn.message)
      if (turn.value.isText())
        return this.concludeUtterance(turn.value.content, note, history, lastEditEnd)
      lastEditEnd = await this.executeToolCalls(
        turn.value.calls,
        note,
        history,
        lastEditEnd,
        skills,
      )
    }
    return Outcomes.failure('chat', `edit loop exceeded ${MAX_ITERATIONS} iterations`)
  }

  // The note goes last, not in the system message: history holds snapshots from
  // earlier turns, and the model weights the most recent message most heavily.
  // Freshest content in the freshest position.
  private askModel(
    note: OpenNote,
    history: readonly ChatMessage[],
    skills: readonly Skill[],
    instructions: AgentsMdChain,
  ) {
    const system = ChatMessage.system(PromptBuilder.build(note.context(), skills, instructions))
    const current = ChatMessage.system(PromptBuilder.context(note.context()))
    return this.modelProvider.complete([system, ...history, current], TOOL_SCHEMAS)
  }

  private concludeUtterance(
    summary: string,
    note: OpenNote,
    history: ChatMessage[],
    lastEditEnd: EditorPosition | null,
  ): Outcome<string> {
    history.push(ChatMessage.model(summary))
    if (lastEditEnd) this.noteEditor.focusEdit(note.editor, lastEditEnd)
    return Outcomes.success(summary)
  }

  private async executeToolCalls(
    toolCalls: ToolCall[],
    note: OpenNote,
    history: ChatMessage[],
    previousEditEnd: EditorPosition | null,
    skills: readonly Skill[],
  ): Promise<EditorPosition | null> {
    history.push(ChatMessage.modelToolCalls(toolCalls))
    let currentEditEnd = previousEditEnd
    for (const call of toolCalls) {
      const outcome = await this.executeToolCall(call, note, skills)
      history.push(ChatMessage.toolCallResult(call.id, outcome.result))
      currentEditEnd = outcome.editedTo ?? currentEditEnd
    }
    return currentEditEnd
  }

  private async executeToolCall(
    call: ToolCall,
    note: OpenNote,
    skills: readonly Skill[],
  ): Promise<ToolCallOutcome> {
    if (call.isLoadSkill()) return { result: await this.loadSkill(call, skills) }
    return this.callToolOnNote(call, note)
  }

  private callToolOnNote(call: ToolCall, note: OpenNote): ToolCallOutcome {
    const parsed = NoteOperationParser.parse(call)
    if (parsed.hasFailed()) return { result: `invalid arguments: ${parsed.message}` }
    return this.doCallToolOnNote(parsed.value, note)
  }

  private async loadSkill(call: ToolCall, skills: readonly Skill[]): Promise<string> {
    const name = call.argument('name')
    const skill = skills.find((candidate) => candidate.name === name)
    if (!skill) return `no skill named ${name} in this vault`
    const body = await this.skillRepository.readBody(skill)
    return body ?? `skill ${skill.name} could not be read`
  }

  private doCallToolOnNote(op: EditOperation, note: OpenNote): ToolCallOutcome {
    const result = this.noteEditor.apply(note.editor, note.context(), op)
    if (result.applied) {
      this.agentSession.operationHistory.push(op)
      return { result: 'applied', editedTo: result.endedAt }
    }
    if (result.reason === 'noMatch') return { result: 'anchor not found in note' }
    return { result: 'anchor matches multiple places; use a longer anchor' }
  }
}
