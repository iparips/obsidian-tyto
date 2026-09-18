import { ToolCall, ToolSchema } from '../../model/providers/types'
import { ObsidianCommandRunner } from '../../commands/obsidian-command-runner'
import { NoteReader } from '../../search/note-reader'
import { Attempt, Outcomes } from '../../shared/models/outcome'
import { TargetNoteWriter } from '../note-editing/target-note-writer'
import { NotesOpenedCounter } from '../turn/notes-opened-counter'
import { ObsidianCommandCatalogue } from '../../commands/obsidian-command-catalogue'
import { AllowedObsidianCommand } from '../../commands/models/allowed-obsidian-command'
import { ToolCatalogue } from './tool-schemas'
import { ProgressLine } from '../progress-line'
import { HarnessResult, Refusal, TurnState } from './harness-result'
import { ObsidianCommandRanResult, OpenNoteResult, TextResult } from './harness-results'
import { SearchToolsService } from './search-tools-service'
import { NotePathsShortlistTool } from './note-paths-shortlist-tool'
import { DateToolService } from './date-tool-service'

export class HarnessToolsService {
  constructor(
    private commandRunner: ObsidianCommandRunner,
    private noteReader: NoteReader,
    private commandCatalogue: ObsidianCommandCatalogue,
    private searchEnabled: boolean,
    private searchToolsService: SearchToolsService,
    private dateToolService: DateToolService,
    // A read of the turn's own note comes from where its writes go, so an
    // anchor the model matches is one the write will find (D1). Null in the
    // tests that exercise a tool having nothing to do with the target.
    private targetNoteWriter: TargetNoteWriter | null = null,
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
  getToolCallSchemas(skillsExist = false): ToolSchema[] {
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
    if (call.isGlobNotes()) return this.searchToolsService.glob(call, turn)
    if (call.isGrepNotes()) return this.searchToolsService.grep(call, turn)
    if (call.isResolveDate()) return this.dateToolService.resolve(call)
    if (call.isListTags()) return this.searchToolsService.listTags(call)
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
      return Refusal.of(HarnessToolsService.unseenMessage(path))
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
    const contentsOutcome = await this.readContents(path, turn)
    if (contentsOutcome.hasFailed()) return Refusal.of(contentsOutcome.message)
    turn.pathsReturnedByVault.recordPaths([path])
    turn.notesRead.record(path)
    return new TextResult(
      HarnessToolsService.contentsOrEmptyNote(path, contentsOutcome.value),
      ProgressLine.read(path),
    )
  }

  // An empty note read back as an empty string is indistinguishable from a read
  // that answered nothing, so the model retries it until the turn runs out of
  // steps. Saying the note is empty is the whole fix: the read succeeded, and
  // the model needs to know it may write rather than read again.
  private static contentsOrEmptyNote(path: string, contents: string): string {
    if (contents.trim().length > 0) return contents
    return `${path} is empty; the read succeeded and there is nothing in the note to anchor to`
  }

  // The turn's own note reads from the editor holding it, every other note from
  // the file (D1). A tab that moved has no editor of the target to read, so the
  // writer answers from the file and the read is stale rather than wrong.
  private async readContents(path: string, turn: TurnState): Promise<Attempt<string>> {
    const target = turn.targetNote()
    if (!this.targetNoteWriter || target?.path !== path) return this.noteReader.read(path)
    return Outcomes.success(
      await this.targetNoteWriter.read(target, turn.wasWrittenThroughEditor(path)),
    )
  }
}
