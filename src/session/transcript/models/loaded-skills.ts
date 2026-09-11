import { ChatMessage, ToolCall } from '../../../model/providers/types'

// The skill bodies one session loaded, gathered as the document walks the turn
// steps. A body reaches the model as the tool result of a load_skill call, so
// inlining it puts several hundred words inside one step's Request block, where
// what the step did is one line above it.
//
// Held rather than stored: the body is already in the chat history, and
// recording it a second time would let the two disagree.
export class LoadedSkills {
  private readonly bodies = new Map<string, string>()

  // The call naming the skill sits in the step before, so the result is matched
  // by the id the call carried rather than by its position.
  record(calls: readonly ToolCall[], results: readonly ChatMessage[]): void {
    calls.filter((call) => call.isLoadSkill()).forEach((call) => this.recordOne(call, results))
  }

  private recordOne(call: ToolCall, results: readonly ChatMessage[]): void {
    const result = results.find((message) => message.toolCallId === call.id)
    if (!result || !LoadedSkills.isBody(result.content)) return
    this.bodies.set(call.argument('name'), result.content)
  }

  // A body is a skill file, so it runs to several lines. The three answers that
  // are not a body are each one sentence: no skill of that name, one already
  // loaded this turn, or one that could not be read. Those stay in the step
  // that got them, where the refusal is the thing worth reading.
  private static isBody(content: string): boolean {
    return content.includes('\n')
  }

  // The skill whose body this result carried, or null where it carried a
  // refusal: a refusal stays in the step that got it, where it is the thing
  // worth reading.
  skillCitedBy(result: ChatMessage, calls: readonly ToolCall[]): string | null {
    const call = calls.find((each) => each.id === result.toolCallId && each.isLoadSkill())
    const name = call?.argument('name')
    return name && this.bodies.has(name) ? name : null
  }

  names(): string[] {
    return [...this.bodies.keys()]
  }

  bodyOf(name: string): string {
    return this.bodies.get(name) ?? ''
  }

  isEmpty(): boolean {
    return this.bodies.size === 0
  }
}
