import { PathsReturnedByVaultRepository } from '../paths-returned-by-vault-repository'
import { SpokenToolCall } from './spoken-tool-call'
import { UncitedReply } from './uncited-reply'

// The tool the prompt names, repeated here because the correction the model
// reads has to name it and the prompt is not in scope at this point.
const ANSWER_TOOL = 'answer_from_search'

// Whether a turn may end on the text the model replied with. The prompt says to
// answer through answer_from_search and to cite each note as a wikilink; a model
// reads both, complies when told directly and reverts a turn later. So the
// harness checks what the prompt asks for rather than asking again more loudly.
//
// Three ways a reply is wrong, and they do not share a trigger. A call written as
// text is wrong whatever the search found. The other two need a search that
// returned paths: one that matched nothing leaves nothing to answer from and
// nothing to cite, and a turn ending in text is then the honest ending.
export class SearchAnswerVerdict {
  private constructor(private readonly correction: string | null) {}

  // A spoken call is checked before the search, because it is a call the model
  // failed to emit rather than an answer: it happens when a search found
  // nothing, which is exactly where the rules below stand aside.
  static onReply(reply: string, pathsFound: PathsReturnedByVaultRepository): SearchAnswerVerdict {
    const spoken = SpokenToolCall.inReply(reply)
    if (spoken.wasSpoken()) return new SearchAnswerVerdict(spoken.message())
    if (!pathsFound.foundAnything()) return new SearchAnswerVerdict(null)
    return new SearchAnswerVerdict(SearchAnswerVerdict.corrected(reply, pathsFound))
  }

  // The tool comes first: an answer sent through the tool is checked for its
  // citations by the same rule, so telling the model to cite a reply it should
  // not have written as a reply corrects the smaller of the two mistakes.
  private static corrected(
    reply: string,
    pathsFound: PathsReturnedByVaultRepository,
  ): string | null {
    const uncited = UncitedReply.inReply(reply, pathsFound.pathsLongestFirst())
    if (uncited.hasUncitedPaths()) return uncited.message()
    return SearchAnswerVerdict.wrongEndingMessage()
  }

  // A reply that cited everything correctly still went out as text rather than
  // through the tool, which is what the sources argument and the copyable block
  // exist for.
  private static wrongEndingMessage(): string {
    return `a search found notes this turn, so the answer goes through ${ANSWER_TOOL} with every path it drew on in sources, not as a plain reply`
  }

  needsCorrecting(): boolean {
    return this.correction !== null
  }

  message(): string {
    return this.correction ?? ''
  }
}
