import { ToolCall, ToolSchema } from '../providers/types'
import { CommandRunner } from '../commands/command-runner'
import { CommandEffect } from '../commands/models/command-effect'
import { VaultSearch } from '../search/vault-search'
import { NoteReader } from '../search/note-reader'
import { SearchHit } from '../search/models/search-hit'
import { TurnBudget } from './models/turn-budget'
import { CommandCatalogue } from '../commands/command-catalogue'
import { AllowedCommand } from '../commands/models/allowed-command'
import { ToolCatalogue } from './models/tool-schemas'
import { SeenPaths } from '../search/models/seen-paths'
import { AnswerRequest } from './models/answer-request'
import { TurnStep } from './models/turn-step'

// What the harness tools return to the model. A command effect, a resolved open
// path and a question travel beside the text, because only the loop can act on
// any of them.
export interface HarnessResult {
  result: string
  effect?: CommandEffect
  answer?: { text: string; sources: string[] }
  openPath?: string
  question?: AnswerRequest
  // What the panel shows in the steps list. Present on every call, including
  // the ones that refused, so a turn that went nowhere still says why.
  step?: TurnStep
}

// What a tool reads off the turn it runs in. Narrower than TurnRepository, so
// the tools see the two counters they spend and nothing else.
export interface TurnState {
  readonly budget: TurnBudget
  readonly seenPaths: SeenPaths
}

export class HarnessTools {
  constructor(
    private commandRunner: CommandRunner,
    private vaultSearch: VaultSearch,
    private noteReader: NoteReader,
    private commandCatalogue: CommandCatalogue,
    private searchEnabled: boolean,
  ) {}

  allowedCommands(): readonly AllowedCommand[] {
    return this.commandCatalogue.resolve()
  }

  offersSearch(): boolean {
    return this.searchEnabled
  }

  // A spent flow is dropped from the offered set as well as refused, so a model
  // that reads a cap message as advice cannot spend the rest of the turn
  // retrying the call it just lost.
  schemas(spent: readonly string[] = []): ToolSchema[] {
    return ToolCatalogue.forCapabilities(
      this.allowedCommands().length > 0,
      this.searchEnabled,
      spent,
    )
  }

  // A disabled flow refuses here as well as being absent from the schemas, so
  // the offered tool list is never the only thing keeping it out of reach.
  async execute(call: ToolCall, turn: TurnState): Promise<HarnessResult> {
    if (call.isRunCommand()) return this.runCommand(call, turn.budget)
    // Asking is not a search, so it stays reachable in a vault that allows
    // commands and turns search off.
    if (call.isAskUser()) return HarnessTools.askUser(call, turn.budget)
    if (!this.searchEnabled)
      return HarnessTools.refuse('searching the vault is turned off in settings')
    if (call.isSearchVault()) return this.searchVault(call, turn)
    if (call.isReadNote()) return this.readNote(call, turn.budget)
    if (call.isOpenNote()) return this.openNote(call, turn)
    return HarnessTools.answer(call)
  }

  private async runCommand(call: ToolCall, budget: TurnBudget): Promise<HarnessResult> {
    if (!budget.takeCommand()) return HarnessTools.refuse(TurnBudget.commandCapMessage())
    const commandEffectOutcome = await this.commandRunner.run(call.argument('command_id'))
    if (commandEffectOutcome.hasFailed()) return HarnessTools.refuse(commandEffectOutcome.message)
    const commandEffect = commandEffectOutcome.value
    return { result: commandEffect.describe(), effect: commandEffect }
  }

  private async searchVault(call: ToolCall, turn: TurnState): Promise<HarnessResult> {
    if (!turn.budget.takeSearch()) return HarnessTools.refuse(TurnBudget.searchCapMessage())
    const query = call.argument('query')
    const hits = await this.vaultSearch.search(query, call.numberArgument('modified_within_days'))
    turn.seenPaths.record(hits)
    return { result: HarnessTools.describeHits(hits), step: TurnStep.searched(query, hits.length) }
  }

  // Refused rather than thrown, in the shape every other tool refuses, so the
  // model reads the reason and searches again (FR2, FR3). The path is returned
  // rather than opened: only the loop moves the session (FR1).
  private async openNote(call: ToolCall, turn: TurnState): Promise<HarnessResult> {
    const path = call.argument('path')
    if (!turn.budget.takeOpen()) return HarnessTools.refuse(TurnBudget.openCapMessage())
    if (!turn.seenPaths.includes(path)) return HarnessTools.refuse(HarnessTools.unseenMessage(path))
    const contentsOutcome = await this.noteReader.read(path)
    if (contentsOutcome.hasFailed()) return HarnessTools.refuse(contentsOutcome.message)
    return { result: `opened ${path}`, openPath: path }
  }

  private static unseenMessage(path: string): string {
    return `${path} was not returned by a search this turn; search for it before opening it`
  }

  private async readNote(call: ToolCall, budget: TurnBudget): Promise<HarnessResult> {
    if (!budget.takeSearch()) return HarnessTools.refuse(TurnBudget.searchCapMessage())
    const path = call.argument('path')
    const contentsOutcome = await this.noteReader.read(path)
    if (contentsOutcome.hasFailed()) return HarnessTools.refuse(contentsOutcome.message)
    return { result: contentsOutcome.value, step: TurnStep.read(path) }
  }

  // The question travels back rather than being asked here: HarnessTools runs a
  // tool, it does not wait on a person (FR15, FR16, FR30).
  private static askUser(call: ToolCall, budget: TurnBudget): HarnessResult {
    if (!budget.takeQuestion()) return HarnessTools.refuse(TurnBudget.questionCapMessage())
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

  // Every refusal is a step, since it spent an iteration and is usually what
  // the user most needs to see when a turn goes nowhere.
  private static refuse(reason: string): HarnessResult {
    return { result: reason, step: TurnStep.refused(reason) }
  }

  private static describeHits(hits: readonly SearchHit[]): string {
    if (hits.length === 0) return 'no notes matched that search'
    return hits.map((hit) => hit.describe()).join('\n')
  }
}
