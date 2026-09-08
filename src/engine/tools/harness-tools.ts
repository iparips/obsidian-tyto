import { ToolCall, ToolSchema } from '../../providers/types'
import { ObsidianCommandRunner } from '../../commands/obsidian-command-runner'
import { NoteReader } from '../../search/note-reader'
import { NotesOpenedCounter } from '../turn/notes-opened-counter'
import { ObsidianCommandCatalogue } from '../../commands/obsidian-command-catalogue'
import { AllowedObsidianCommand } from '../../commands/models/allowed-obsidian-command'
import { ToolCatalogue } from './tool-schemas'
import { TurnStep } from '../turn-step'
import { HarnessResult, Refusal, TurnState } from './harness-result'
import { ObsidianCommandRanResult, OpenNoteResult, TextResult } from './harness-results'
import { SearchTools } from './search-tools'
import { NotePathsShortlistTool } from './note-paths-shortlist-tool'

export class HarnessTools {
  constructor(
    private commandRunner: ObsidianCommandRunner,
    private noteReader: NoteReader,
    private commandCatalogue: ObsidianCommandCatalogue,
    private searchEnabled: boolean,
    private searchTools: SearchTools,
    // Auto mode opens the first note the model offers, so the tool that asks is
    // absent rather than answering itself (FR13). A flag here rather than a
    // branch in the loop, so the offered set states the mode in one place.
    private choiceOffered = true,
  ) {}

  allowedCommands(): readonly AllowedObsidianCommand[] {
    return this.commandCatalogue.resolve()
  }

  hasWhitelistedCommands(): boolean {
    return this.allowedCommands().length > 0
  }

  hasSearchEnabled(): boolean {
    return this.searchEnabled
  }

  // The offered set is fixed for a turn: one budget bounds the cost, so no tool
  // drops out part way through and a model never sees the list change under it.
  schemas(skillsExist = false): ToolSchema[] {
    return ToolCatalogue.forCapabilities(
      this.hasWhitelistedCommands(),
      this.searchEnabled,
      this.choiceOffered,
      skillsExist,
    )
  }

  // A disabled flow refuses here as well as being absent from the schemas, so
  // the offered tool list is never the only thing keeping it out of reach.
  async execute(call: ToolCall, turn: TurnState): Promise<HarnessResult> {
    if (call.isRunObsidianCommand()) return this.runObsidianCommand(call)
    if (!this.searchEnabled) return Refusal.of('searching the vault is turned off in settings')
    if (call.isGlobNotes()) return this.searchTools.glob(call, turn)
    if (call.isGrepNotes()) return this.searchTools.grep(call, turn)
    if (call.isReadNote()) return this.readNote(call, turn)
    if (call.isOpenNote()) return this.openNote(call, turn)
    return NotePathsShortlistTool.offerPaths(call, turn)
  }

  private async runObsidianCommand(call: ToolCall): Promise<HarnessResult> {
    const runOutcome = await this.commandRunner.run(call.argument('command_id'))
    if (runOutcome.hasFailed()) return Refusal.of(runOutcome.message)
    const noteOpenedByObsidianCommand = runOutcome.value
    return new ObsidianCommandRanResult(noteOpenedByObsidianCommand)
  }

  // Refused rather than thrown, in the shape every other tool refuses, so the
  // model reads the reason and searches again (FR2, FR3). The path is returned
  // rather than opened: only the loop moves the session (FR1).
  // The seen-path check precedes the cap, so a path the model never found is
  // told so rather than reported as the cap. The cap itself is spent by the
  // dispatcher once the open is granted: a declined note is not one opened.
  private async openNote(call: ToolCall, turn: TurnState): Promise<HarnessResult> {
    const path = call.argument('path')
    if (!turn.pathsReturnedByVault.includes(path))
      return Refusal.of(HarnessTools.unseenMessage(path))
    if (!turn.notesOpenedCounter.canOpen(path))
      return Refusal.of(NotesOpenedCounter.openCapMessage())
    const contentsOutcome = await this.noteReader.read(path)
    if (contentsOutcome.hasFailed()) return Refusal.of(contentsOutcome.message)
    return new OpenNoteResult(`opened ${path}`, path)
  }

  private static unseenMessage(path: string): string {
    return `${path} was not returned by a search this session; search for it before opening it`
  }

  // A read the vault answered is proof the note exists, so the path becomes
  // offerable. Without this a path a skill names can be read but never opened,
  // and the model retries the edit it cannot land.
  private async readNote(call: ToolCall, turn: TurnState): Promise<HarnessResult> {
    const path = call.argument('path')
    const contentsOutcome = await this.noteReader.read(path)
    if (contentsOutcome.hasFailed()) return Refusal.of(contentsOutcome.message)
    turn.pathsReturnedByVault.recordPaths([path])
    return new TextResult(contentsOutcome.value, TurnStep.read(path))
  }
}
