import { ToolCall } from '../providers/types'
import { NoteGlob } from '../search/note-glob'
import { NoteGrep } from '../search/note-grep'
import { SearchReport } from '../search/search-report'
import { GrepRequest } from '../search/models/grep-request'
import { GrepResult } from '../search/models/grep-result'
import { ResultOrder } from '../search/models/result-order'
import { HarnessResult, Refusal, TurnState } from './harness-result'
import { TurnStep } from './models/turn-step'

// The two ways the model reaches a note it cannot name: a glob over paths and a
// grep over content. Both record what they found, or open_note refuses
// everything they offered.
export class SearchTools {
  constructor(
    private noteGlob: NoteGlob,
    private noteGrep: NoteGrep,
  ) {}

  glob(call: ToolCall, turn: TurnState): HarnessResult {
    turn.searchRan()
    const pattern = call.argument('pattern')
    const result = this.noteGlob.find(pattern, SearchTools.orderOf(call))
    turn.seenPaths.recordPaths(result.paths)
    return {
      result: SearchReport.ofGlob(pattern, result),
      step: TurnStep.globbed(pattern, result.total),
    }
  }

  async grep(call: ToolCall, turn: TurnState): Promise<HarnessResult> {
    turn.searchRan()
    const outcome = await this.noteGrep.find(SearchTools.requestOf(call), SearchTools.orderOf(call))
    if (outcome.hasFailed()) return Refusal.of(outcome.message)
    return SearchTools.reported(call.argument('pattern'), outcome.value, turn)
  }

  private static reported(pattern: string, result: GrepResult, turn: TurnState): HarnessResult {
    turn.seenPaths.recordPaths(result.hits.map((hit) => hit.path))
    return {
      result: SearchReport.ofGrep(pattern, result),
      step: TurnStep.grepped(pattern, result.total),
    }
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
