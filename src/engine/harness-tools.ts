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

// What the four release 4 tools return to the model. A command effect travels
// beside the text, because only the loop can act on a rebind.
export interface HarnessResult {
  result: string
  effect?: CommandEffect
  answer?: { text: string; sources: string[] }
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

  schemas(): ToolSchema[] {
    return ToolCatalogue.forCapabilities(this.allowedCommands().length > 0, this.searchEnabled)
  }

  // A disabled flow refuses here as well as being absent from the schemas, so
  // the offered tool list is never the only thing keeping it out of reach.
  async execute(call: ToolCall, budget: TurnBudget): Promise<HarnessResult> {
    if (call.isRunCommand()) return this.runCommand(call, budget)
    if (!this.searchEnabled) return { result: 'searching the vault is turned off in settings' }
    if (call.isSearchVault()) return this.searchVault(call, budget)
    if (call.isReadNote()) return this.readNote(call, budget)
    return HarnessTools.answer(call)
  }

  private async runCommand(call: ToolCall, budget: TurnBudget): Promise<HarnessResult> {
    if (!budget.takeCommand()) return { result: TurnBudget.commandCapMessage() }
    const commandEffectOutcome = await this.commandRunner.run(call.argument('command_id'))
    if (commandEffectOutcome.hasFailed()) return { result: commandEffectOutcome.message }
    const commandEffect = commandEffectOutcome.value
    return { result: commandEffect.describe(), effect: commandEffect }
  }

  private async searchVault(call: ToolCall, budget: TurnBudget): Promise<HarnessResult> {
    if (!budget.takeSearch()) return { result: TurnBudget.searchCapMessage() }
    const hits = await this.vaultSearch.search(
      call.argument('query'),
      call.numberArgument('modified_within_days'),
    )
    return { result: HarnessTools.describeHits(hits) }
  }

  private async readNote(call: ToolCall, budget: TurnBudget): Promise<HarnessResult> {
    if (!budget.takeSearch()) return { result: TurnBudget.searchCapMessage() }
    const contentsOutcome = await this.noteReader.read(call.argument('path'))
    return { result: contentsOutcome.hasFailed() ? contentsOutcome.message : contentsOutcome.value }
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

  private static describeHits(hits: readonly SearchHit[]): string {
    if (hits.length === 0) return 'no notes matched that search'
    return hits.map((hit) => hit.describe()).join('\n')
  }
}
