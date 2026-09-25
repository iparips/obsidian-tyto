import { ToolCall } from '../../model/providers/types'
import { NoteGlob } from '../../search/note-glob'
import { NoteGrep } from '../../search/note-grep'
import { SearchReport } from '../../search/search-report'
import { TagReader } from '../../search/tag-reader'
import { TagReport } from '../../search/tag-report'
import { GrepRequest } from '../../search/models/grep-request'
import { GrepResult } from '../../search/models/grep-result'
import { ResultOrder } from '../../search/models/result-order'
import { HarnessResult, Refusal, TurnState } from './harness-result'
import { TextResult } from './harness-results'
import { ProgressLine } from '../progress-line'

// The two ways the model reaches a note it cannot name: a glob over paths and a
// grep over content. Both record what they found, or open_note refuses
// everything they offered.
export class SearchToolsService {
  constructor(
    private noteGlob: NoteGlob,
    private noteGrep: NoteGrep,
    private tagReader: TagReader,
  ) {}

  glob(call: ToolCall, turn: TurnState): HarnessResult {
    const pattern = call.argument('pattern')
    const result = this.noteGlob.find(pattern, SearchToolsService.orderOf(call))
    turn.pathsReturnedByVault.recordPaths(result.paths)
    turn.pathsFoundBySearch.recordPaths(result.paths)
    return new TextResult(
      SearchReport.ofGlob(pattern, result),
      ProgressLine.globbed(pattern, result.total),
    )
  }

  async grep(call: ToolCall, turn: TurnState): Promise<HarnessResult> {
    const request = SearchToolsService.requestOf(call)
    const outcome = await this.noteGrep.find(request, SearchToolsService.orderOf(call))
    if (outcome.hasFailed()) return Refusal.of(outcome.message)
    return SearchToolsService.reported(request, outcome.value, turn)
  }

  // No TurnState, unlike glob and grep: nothing it returns is a path, so
  // nothing it returned becomes a note the model may open.
  listTags(call: ToolCall): HarnessResult {
    const filter = call.optionalArgument('filter') ?? null
    const result = this.tagReader.findTags(filter)
    return new TextResult(
      TagReport.buildReport(filter, result),
      ProgressLine.listedTags(filter, result.total),
    )
  }

  private static reported(
    request: GrepRequest,
    result: GrepResult,
    turn: TurnState,
  ): HarnessResult {
    const paths = result.hits.map((hit) => hit.path)
    turn.pathsReturnedByVault.recordPaths(paths)
    turn.pathsFoundBySearch.recordPaths(paths)
    const scope = request.scopeDescription()
    return new TextResult(
      SearchReport.ofGrep(request.pattern, result, request.narrows() ? scope : undefined),
      ProgressLine.grepped(request.pattern, scope, result.total),
    )
  }

  private static requestOf(call: ToolCall): GrepRequest {
    return new GrepRequest(
      call.argument('pattern'),
      call.optionalArgument('path_pattern') ?? null,
      call.stringsArgument('paths'),
      call.booleanArgument('paths_only'),
    )
  }

  private static orderOf(call: ToolCall): ResultOrder {
    return ResultOrder.of(call.optionalArgument('sort'), call.optionalArgument('order'))
  }
}
