import { Recorder } from '../recorder'
import { MistralProvider } from '../model/providers/mistral-provider'
import { SessionPanelProps } from '../session/views/SessionPanel'
import { EditEngine } from '../engine/edit-engine'
import { ActiveNote } from './active-note'
import { EngineFactory } from './engine-factory'
import { InstructionListeners } from '../session/instruction-listeners'
import { SessionListeners } from '../session/session-listeners'
import { SessionProgress } from '../session/session-progress'
import { TurnAskersService } from '../session/turn-askers-service'
import { TurnNotices } from '../session/turn-notices'
import { TytoSettings } from '../settings/settings'
import { TranscriptRepository } from '../session/transcript/transcript-repository'
import { TranscriptBuilder } from '../session/transcript/transcript-builder'
import { SessionRepository } from '../session/session-repository'
import { NoteName } from '../session/models/note-name'
import { PanelEntry } from '../session/models/panel-state'
import { RestoredText } from '../session/models/restored-text'
import { StoredMessages, SessionSnapshot } from '../session/models/session-snapshot'
import { SessionRecorder } from '../session/session-recorder'
import { SessionStore } from '../session/session-store'

// Everything one session publishes on and parks on, built together so the panel
// and the engine reach the same set.
interface SessionChannels {
  listeners: InstructionListeners
  session: SessionListeners
  askers: TurnAskersService
  notices: TurnNotices
}

// What the plugin cannot answer for itself: whether the panel is on screen, how
// to put it there when the user asks, and when Obsidian goes to the background,
// which is what ends a recording in progress.
export interface PanelPresence {
  isVisible(): boolean
  reveal(): void
  onObsidianBackgrounded(listener: () => void): () => void
  startNewSession(): void
}

// Assembles one session's panel props. Every collaborator is explicit, and this
// is the only place that knows how a panel, an engine and a notice fit together.
export class SessionBuilder {
  constructor(
    private settings: TytoSettings,
    private engineFactory: EngineFactory,
    private followEngine: (engine: EditEngine) => void,
    // Asked at assemble time rather than handed a note, so a session built and
    // a session restored reach the same answer.
    private activeNote: ActiveNote,
    // Where the record goes. Built by the plugin, which is the only place that
    // knows the vault adapter and the folder the plugin was installed into.
    private store: SessionStore,
    // From the manifest, so a transcript read months later says which build of
    // the plugin produced it.
    private pluginVersion = 'unknown',
  ) {}

  build(presence: PanelPresence): SessionPanelProps {
    return this.assemble(
      presence,
      [],
      new SessionRepository(null),
      // Nothing preceded the first step of a session built from scratch, so the
      // transcript starts at zero.
      new TranscriptRepository(),
    )
  }

  // From a record rather than from nothing: what the record supplies is the
  // conversation and the entries. The note comes from the workspace, like every
  // other session's.
  restore(stored: SessionSnapshot, presence: PanelPresence): SessionPanelProps {
    const messages = stored.messages.map((message) => StoredMessages.toMessage(message))
    return this.assemble(
      presence,
      // Last, so the restored line marks where the restored turns stop and the
      // transcript starts explaining itself again.
      [
        ...stored.entries,
        { kind: 'restored', text: RestoredText.of(SessionBuilder.writtenAt(stored)) },
      ],
      // No target from the record: assemble reads the workspace for it. The
      // record names the note a session was on, not the note it comes back on.
      SessionRepository.restored(null, messages),
      new TranscriptRepository(messages.length),
    )
  }

  // Everything the two share, which is everything after the starting point.
  private assemble(
    presence: PanelPresence,
    entries: PanelEntry[],
    sessions: SessionRepository,
    // Built here rather than in EngineFactory, which returns only an EditEngine:
    // the panel reads both, and a recorded step is only meaningful beside the
    // history it indexes into.
    transcript: TranscriptRepository,
  ): SessionPanelProps {
    // The rule, in the one place both entry points reach: the target is what the
    // user has open, whatever the file a caller held or the record remembered.
    const path = this.activeNote.path()
    sessions.bindTo(path)
    const modelProvider = new MistralProvider(this.settings.mistralApiKey, this.settings.editModel)
    const channels = this.channelsFor(presence)
    const engine = this.engineFor(modelProvider, channels, transcript, sessions)
    const recorder = new SessionRecorder(sessions, this.store)
    return {
      noteName: path === null ? null : NoteName.of(path),
      notePath: path,
      entries,
      recorder: new Recorder(),
      transcribe: (blob, mimeType) => modelProvider.transcribe(blob, mimeType),
      startNewSession: () => presence.startNewSession(),
      onObsidianBackgrounded: (listener) => presence.onObsidianBackgrounded(listener),
      settings: this.settings,
      transcriptOf: (entries) => this.transcriptBuilder(sessions, transcript).build(entries),
      recordHistory: (entries) => recorder.record(entries),
      ...SessionBuilder.enginePanelProps(engine, channels),
    }
  }

  // Absent on a record written before the field existed, and unusable on one
  // whose JSON held something other than a number. Both read as no stamp, since
  // an Invalid Date on screen is worse than a line without a time.
  private static writtenAt(stored: SessionSnapshot): Date | null {
    if (typeof stored.writtenAt !== 'number') return null
    const at = new Date(stored.writtenAt)
    return Number.isNaN(at.getTime()) ? null : at
  }

  private transcriptBuilder(
    sessions: SessionRepository,
    transcript: TranscriptRepository,
  ): TranscriptBuilder {
    return new TranscriptBuilder(this.settings, this.pluginVersion, sessions, transcript)
  }

  // Everything the panel reads off a running turn, and everything it answers a
  // parked one with.
  private static enginePanelProps(
    engine: EditEngine,
    { listeners, session, askers, notices }: SessionChannels,
  ): EnginePanelProps {
    return {
      processUtterance: (text) => engine.processUtterance(text),
      cancelTurn: () => engine.cancelTurn(),
      onInstructions: (listener) => listeners.subscribe(listener),
      onWarning: (listener) => session.warnings.subscribe(listener),
      onStep: (listener) => session.steps.subscribe(listener),
      onAnswer: (listener) => session.answers.subscribe(listener),
      onTargetNoteChanged: (listener) => session.retargets.subscribe(listener),
      onChoiceRequested: (listener) => askers.choices.subscribe(listener),
      onQuestionAsked: (listener) => askers.questions.subscribe(listener),
      notifySucceeded: (summary) => notices.finished(summary),
      notifyFailed: (message) => notices.failed(message),
    }
  }

  private channelsFor(presence: PanelPresence): SessionChannels {
    const notices = new TurnNotices(
      () => presence.isVisible(),
      () => presence.reveal(),
    )
    return {
      listeners: new InstructionListeners(),
      session: new SessionListeners(),
      notices,
      askers: new TurnAskersService(notices, this.settings.openMode),
    }
  }

  private engineFor(
    modelProvider: MistralProvider,
    { listeners, session, askers }: SessionChannels,
    transcript: TranscriptRepository,
    sessions: SessionRepository,
  ): EditEngine {
    const engine = this.engineFactory.build(
      modelProvider,
      // The factory reads the file only to default the repository it is handed
      // below, and a restored session has a path rather than a file.
      null,
      new SessionProgress(session, transcript).publisher(),
      {
        noteChoiceService: (cancellation, chosen) => askers.noteChoiceService(cancellation, chosen),
        userQuestionService: (cancellation) => askers.userQuestionService(cancellation),
      },
      transcript,
      sessions,
    )
    this.followEngine(engine)
    return engine
  }
}

// The props that come off the engine rather than off the plugin. Named so the
// spread that assembles them stays type-checked.
type EnginePanelProps = Pick<
  SessionPanelProps,
  | 'processUtterance'
  | 'cancelTurn'
  | 'onInstructions'
  | 'onWarning'
  | 'onStep'
  | 'onAnswer'
  | 'onTargetNoteChanged'
  | 'onChoiceRequested'
  | 'onQuestionAsked'
  | 'notifySucceeded'
  | 'notifyFailed'
>
