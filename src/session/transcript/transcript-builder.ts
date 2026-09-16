import { TytoSettings } from '../../settings/settings'
import { PanelItem } from '../models/panel-state'
import { SessionRepository } from '../session-repository'
import { TranscriptRepository } from './transcript-repository'
import { TranscriptSource } from './models/transcript-source'

// Where the two halves of a transcript meet: what the panel showed, and what
// the turns recorded beside the history they index into. Gathered at the click,
// so the document is a snapshot of the session as it stands rather than of the
// moment the panel was built.
export class TranscriptBuilder {
  constructor(
    private settings: TytoSettings,
    private pluginVersion: string,
    private sessions: SessionRepository,
    private transcript: TranscriptRepository,
  ) {}

  build(entries: readonly PanelItem[]): TranscriptSource {
    return new TranscriptSource(
      {
        copiedAt: new Date(),
        pluginVersion: this.pluginVersion,
        notePath: this.sessions.targetNote(),
      },
      this.settings,
      entries,
      this.sessions.chatHistory(),
      this.transcript.recordedSteps(),
      this.transcript.recordedEndings(),
      this.transcript.recordedParts(),
    )
  }
}
