import { ToolCall, ToolSchema } from '../providers/types'
import { CommandRunner } from '../commands/command-runner'
import { NoteReader } from '../search/note-reader'
import { TurnBudget } from './models/turn-budget'
import { CommandCatalogue } from '../commands/command-catalogue'
import { AllowedCommand } from '../commands/models/allowed-command'
import { ToolCatalogue } from './models/tool-schemas'
import { AnswerRequest } from './models/answer-request'
import { TurnStep } from './models/turn-step'
import { HarnessResult, Refusal, TurnState } from './harness-result'
import { SearchTools } from './search-tools'
import { ShortlistTool } from './shortlist-tool'

export class HarnessTools {
  constructor(
    private commandRunner: CommandRunner,
    private noteReader: NoteReader,
    private commandCatalogue: CommandCatalogue,
    private searchEnabled: boolean,
    private searchTools: SearchTools,
    // Auto mode opens the first note the model offers, so the tool that asks is
    // absent rather than answering itself (FR13). A flag here rather than a
    // branch in the loop, so the offered set states the mode in one place.
    private choiceOffered = true,
  ) {}

  allowedCommands(): readonly AllowedCommand[] {
    return this.commandCatalogue.resolve()
  }

  offersSearch(): boolean {
    return this.searchEnabled
  }

  // The offered set is fixed for a turn: one budget bounds the cost, so no tool
  // drops out part way through and a model never sees the list change under it.
  schemas(skillsExist = false): ToolSchema[] {
    return ToolCatalogue.forCapabilities(
      this.allowedCommands().length > 0,
      this.searchEnabled,
      this.choiceOffered,
      skillsExist,
    )
  }

  // A disabled flow refuses here as well as being absent from the schemas, so
  // the offered tool list is never the only thing keeping it out of reach.
  async execute(call: ToolCall, turn: TurnState): Promise<HarnessResult> {
    if (call.isRunCommand()) return this.runCommand(call)
    // Asking is not a search, so it stays reachable in a vault that allows
    // commands and turns search off.
    if (call.isAskUser()) return HarnessTools.askUser(call)
    if (!this.searchEnabled) return Refusal.of('searching the vault is turned off in settings')
    if (call.isGlobNotes()) return this.searchTools.glob(call, turn)
    if (call.isGrepNotes()) return this.searchTools.grep(call, turn)
    if (call.isReadNote()) return this.readNote(call)
    if (call.isOpenNote()) return this.openNote(call, turn)
    if (call.isChooseNote()) return ShortlistTool.offer(call, turn)
    return HarnessTools.answer(call)
  }

  private async runCommand(call: ToolCall): Promise<HarnessResult> {
    const commandEffectOutcome = await this.commandRunner.run(call.argument('command_id'))
    if (commandEffectOutcome.hasFailed()) return Refusal.of(commandEffectOutcome.message)
    const commandEffect = commandEffectOutcome.value
    return { result: commandEffect.describe(), effect: commandEffect }
  }

  // Refused rather than thrown, in the shape every other tool refuses, so the
  // model reads the reason and searches again (FR2, FR3). The path is returned
  // rather than opened: only the loop moves the session (FR1).
  // The seen-path check precedes the cap, so a path the model never found is
  // told so rather than reported as the cap. The cap itself is spent by the
  // dispatcher once the open is granted: a declined note is not one opened.
  private async openNote(call: ToolCall, turn: TurnState): Promise<HarnessResult> {
    const path = call.argument('path')
    if (!turn.seenPaths.includes(path)) return Refusal.of(HarnessTools.unseenMessage(path))
    if (!turn.budget.canOpen(path)) return Refusal.of(TurnBudget.openCapMessage())
    const contentsOutcome = await this.noteReader.read(path)
    if (contentsOutcome.hasFailed()) return Refusal.of(contentsOutcome.message)
    return { result: `opened ${path}`, openPath: path }
  }

  private static unseenMessage(path: string): string {
    return `${path} was not returned by a search this session; search for it before opening it`
  }

  private async readNote(call: ToolCall): Promise<HarnessResult> {
    const path = call.argument('path')
    const contentsOutcome = await this.noteReader.read(path)
    if (contentsOutcome.hasFailed()) return Refusal.of(contentsOutcome.message)
    return { result: contentsOutcome.value, step: TurnStep.read(path) }
  }

  // The question travels back rather than being asked here: HarnessTools runs a
  // tool, it does not wait on a person (FR15, FR16, FR30).
  private static askUser(call: ToolCall): HarnessResult {
    return {
      result: 'asked the user; their answer follows',
      question: new AnswerRequest(call.argument('question'), call.stringsArgument('suggestions')),
    }
  }

  // Confirmation only: the answer reaches the user through the panel, and no
  // tool can carry it into a note (FR31).
  private static answer(call: ToolCall): HarnessResult {
    const text = call.argument('answer')
    return {
      result: 'the answer reached the panel; say nothing further about it',
      answer: { text, sources: call.stringsArgument('sources') },
    }
  }
}
