import { ChatMessage } from '../../model/providers/types'
import { LoadedSkills } from './loaded-skills'
import { TranscriptSource } from './models/transcript-source'
import { TranscriptTurn } from './models/transcript-turn'
import { TranscriptAppendix } from './transcript-appendix'
import { TranscriptMetadata } from './transcript-metadata'
import { TranscriptTurnSection } from './transcript-turn-section'

// The session as Markdown: panel entries, recorded steps and settings in, one
// string out. Pure, with no clipboard and no React, so the format is testable
// without a DOM or a model.
export class TranscriptDocument {
  static write(source: TranscriptSource): string {
    const skills = TranscriptDocument.skillsLoadedIn(source.chatHistory)
    const sections = new TranscriptTurnSection(
      source,
      TranscriptTurn.allPanelSteps(source.entries),
      skills,
    )
    return [
      '# Tyto session transcript',
      '',
      ...TranscriptMetadata.write(source),
      '',
      ...TranscriptTurn.split(source.entries).flatMap((turn) => sections.write(turn)),
      ...TranscriptAppendix.write(source.parts, skills),
    ]
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .concat('\n')
  }

  // Walked once over the whole history rather than per turn: a skill loaded in
  // turn one is still in the conversation when turn three cites it.
  private static skillsLoadedIn(history: readonly ChatMessage[]): LoadedSkills {
    const skills = new LoadedSkills()
    skills.record(
      history.flatMap((message) => message.toolCalls),
      history.filter((message) => message.isToolResult()),
    )
    return skills
  }
}
