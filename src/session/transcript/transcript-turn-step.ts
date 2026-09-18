import { ChatMessage, ToolCall } from '../../model/providers/types'
import { ProgressLine } from '../models/panel-state'
import { LoadedSkills } from './loaded-skills'
import { PartName, RecordedEnding, RecordedTurnStep, StepCharge } from './models/transcript-record'
import { RepeatedCalls } from './repeated-calls'
import { TranscriptEntryLines } from './transcript-entry-lines'

// A step whose provider call failed appended nothing, so the slice is empty by
// construction. The wording says why rather than reporting the model as silent.
const NO_REPLY_RECORDED = 'no reply recorded: the provider call did not return'
// The model answered and said nothing, which is a fact about the reply rather
// than about the harness that carried it.
const AN_EMPTY_REPLY = 'the model returned an empty reply'

const PART_LABELS: Record<PartName, string> = {
  systemPrompt: 'system prompt',
  dateMessage: 'date',
  sessionTarget: 'note context',
}

// What one turn step sends and gets back, read off the two history slices it
// sits between. ToolCallExecutor appends the model's answer after the step is
// recorded, so a step's own answer opens the next step's slice.
export interface TurnStepHistory {
  sent: readonly ChatMessage[]
  answered: readonly ChatMessage[]
  // Only the session's last step has any: every earlier step is followed by one
  // whose Request block renders what came after it.
  harnessNotes: readonly ChatMessage[]
}

// One pass of the turn loop, in the three blocks the loop runs them in: what
// the model was sent, what it returned, and what the harness did with that.
// A step's Harness block is what the next step's Request carries as its tool
// result, so the blocks chain and a loop reads as a loop.
export class TranscriptTurnStep {
  static write(
    step: RecordedTurnStep,
    history: TurnStepHistory,
    progressLines: readonly ProgressLine[],
    ending: RecordedEnding | null,
    skills: LoadedSkills,
    repeats: RepeatedCalls,
  ): string[] {
    return [
      `### Turn step ${step.step + 1}`,
      '',
      ...TranscriptTurnStep.request(step, history.sent, skills),
      '',
      ...TranscriptTurnStep.response(history.answered, step.charge, repeats),
      '',
      ...TranscriptTurnStep.harness(progressLines, ending, history.harnessNotes),
    ]
  }

  // The parts cited by version rather than quoted, which is what keeps a
  // repeated step to a few lines.
  private static request(
    step: RecordedTurnStep,
    sent: readonly ChatMessage[],
    skills: LoadedSkills,
  ): string[] {
    const cited = step.parts.map((part) => `${PART_LABELS[part.name]} v${part.version}`).join(', ')
    const calls = sent.flatMap((message) => message.toolCalls)
    const carried = sent.filter((message) => !message.hasToolCalls() && !isModelText(message))
    return [
      'Request to model',
      `- ${cited}`,
      ...carried.flatMap((message) => requestLines(message, calls, skills)),
    ]
  }

  // Read off the history rather than stored: the model's answer is already
  // written there, and storing it twice would let the two disagree.
  private static response(
    answered: readonly ChatMessage[],
    charge: StepCharge | null,
    repeats: RepeatedCalls,
  ): string[] {
    const opening = ['Response from model', ...budgetLines(charge)]
    const spoke = answered.filter((message) => message.hasToolCalls() || isModelText(message))
    if (spoke.length === 0) return [...opening, `- ${chargedNothingRecorded(charge)}`]
    if (spoke.every(saidNothing)) return [...opening, `- ${AN_EMPTY_REPLY}`]
    return [...opening, ...spoke.flatMap((message) => responseLines(message, repeats))]
  }

  // The Outcome line sits here because the harness is what decides whether the
  // turn goes on. The model never ends a turn, so a step that ends one is a
  // harness verdict on what the tool calls returned.
  private static harness(
    progressLines: readonly ProgressLine[],
    ending: RecordedEnding | null,
    harnessNotes: readonly ChatMessage[],
  ): string[] {
    return [
      'Harness',
      ...progressLines.map(TranscriptEntryLines.line),
      ...harnessNotes.map((message) => `- ${message.content}`),
      `- Outcome: ${ending?.kind ?? 'continue'}`,
    ]
  }
}

// The model's own words, which a tool result and the utterance are not. Read
// off the roles the history already carries rather than off a second record.
const isModelText = (message: ChatMessage): boolean =>
  !message.isUser() && !message.isToolResult() && !message.isSystem()

const requestLines = (
  message: ChatMessage,
  calls: readonly ToolCall[],
  skills: LoadedSkills,
): string[] => {
  // A harness note the user never typed, so labelling it user would file a
  // retarget as something the user said in this turn.
  if (message.isSystem()) return [`- harness: ${message.content}`]
  if (!message.isToolResult()) return [`- user: ${message.content}`]
  // A skill body is several hundred words, and the same body reaches every step
  // after it through the history. Cited so the step stays one line.
  const skill = skills.skillCitedBy(message, calls)
  if (skill) return [`- tool result: skill ${skill}, in the appendix`]
  return blockUnder('- tool result', 'text', message.content)
}

// A reply may carry text, tool calls or both, so the text is written above the
// calls rather than instead of them: the sentence reads before what it did.
const responseLines = (message: ChatMessage, repeats: RepeatedCalls): string[] => {
  const text = message.content === '' ? [] : [`- text: ${message.content}`]
  return [...text, ...message.toolCalls.flatMap((call) => toolCallLines(call, repeats))]
}

// Neither words nor calls reached the harness. Read off the message rather than
// off the slice, since such a reply is a message in it rather than an absence.
const saidNothing = (message: ChatMessage): boolean =>
  message.content === '' && !message.hasToolCalls()

// First in the block, and only where a charge was recorded: a step whose
// provider call failed drew none, and inventing a number would report a charge
// the turn never took.
const budgetLines = (charge: StepCharge | null): string[] => {
  if (!charge) return []
  return [`- Spend: ${charge.charged} charged, ${charge.usedAfter} of ${charge.budget} used`]
}

// An empty slice on a charged step means the harness cannot account for the
// step, which is a defect in the record rather than a fact about the turn.
const chargedNothingRecorded = (charge: StepCharge | null): string =>
  charge ? 'nothing recorded' : NO_REPLY_RECORDED

// The mark sits on the call's own line, above the JSON, so a reader skimming
// the response blocks sees the loop without opening anything. The step number is
// the one the Turn step heading shows, which is the index plus one.
const toolCallLines = (call: ToolCall, repeats: RepeatedCalls): string[] => {
  const repeated = repeats.repeatedStepOf(call)
  const mark = repeated === null ? '' : ` - repeats step ${repeated + 1}`
  return blockUnder(`- tool call ${call.name}${mark}`, 'json', JSON.stringify(call.args, null, 2))
}

// What a step is diagnosed from goes in a block of its own rather than on the
// end of the line: a list of paths or a result listing ten notes is unreadable
// once it wraps. Indented two spaces, so the block sits inside the list item.
const blockUnder = (item: string, language: string, body: string): string[] => [
  item,
  '',
  ...[`\`\`\`${language}`, ...body.split('\n'), '```'].map((line) => `  ${line}`),
  '',
]
