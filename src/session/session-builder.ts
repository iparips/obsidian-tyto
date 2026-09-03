import { Notice, TFile } from 'obsidian'
import { Recorder } from '../capture/recorder'
import { MistralProvider } from '../providers/mistral-provider'
import { SessionPanelProps } from './views/SessionPanel'
import { EditEngine } from '../engine/edit-engine'
import { EngineFactory } from '../engine/engine-factory'
import { InstructionListeners } from './instruction-listeners'
import { SessionListeners } from './session-listeners'
import { SessionProgress } from './session-progress'
import { TurnAskers } from './turn-askers'
import { TurnNotices } from './turn-notices'
import { OwlSettings } from '../settings/settings'

// Everything one session publishes on and parks on, built together so the panel
// and the engine reach the same set.
interface SessionChannels {
  listeners: InstructionListeners
  session: SessionListeners
  askers: TurnAskers
  notices: TurnNotices
}

// What the plugin cannot answer for itself: whether the panel is on screen, and
// how to put it there when the user asks.
export interface PanelPresence {
  isVisible(): boolean
  reveal(): void
  onHidden(listener: () => void): () => void
  startNewSession(): void
}

// Assembles one session's panel props. Every collaborator is explicit, and this
// is the only place that knows how a panel, an engine and a notice fit together.
export class SessionBuilder {
  constructor(
    private settings: OwlSettings,
    private engineFactory: EngineFactory,
    private followEngine: (engine: EditEngine) => void,
  ) {}

  build(file: TFile | null, presence: PanelPresence): SessionPanelProps {
    const modelProvider = new MistralProvider(this.settings.mistralApiKey, this.settings.editModel)
    const channels = this.channelsFor(presence)
    const engine = this.engineFor(modelProvider, file, channels)
    return {
      noteName: file?.basename ?? null,
      notePath: file?.path ?? null,
      recorder: new Recorder(),
      transcribe: (blob, mimeType) => modelProvider.transcribe(blob, mimeType),
      startNewSession: () => presence.startNewSession(),
      onHidden: (listener) => presence.onHidden(listener),
      notify: (message) => void new Notice(message),
      ...SessionBuilder.enginePanelProps(engine, channels),
    }
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
      onCommandRun: (listener) => session.commandRuns.subscribe(listener),
      onWarning: (listener) => session.warnings.subscribe(listener),
      onStep: (listener) => session.steps.subscribe(listener),
      onAnswer: (listener) => session.answers.subscribe(listener),
      onTargetNoteChanged: (listener) => session.retargets.subscribe(listener),
      onOpenRequested: (listener) => askers.opens.subscribe(listener),
      onQuestionAsked: (listener) => askers.questions.subscribe(listener),
      onTurnFinished: (summary) => notices.finished(summary),
      onTurnFailed: (message) => notices.failed(message),
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
      askers: new TurnAskers(notices, this.settings.openMode),
    }
  }

  private engineFor(
    modelProvider: MistralProvider,
    file: TFile | null,
    { listeners, session, askers }: SessionChannels,
  ): EditEngine {
    const engine = this.engineFactory.build(
      modelProvider,
      file,
      new SessionProgress(session, listeners).publisher(),
      {
        openApproval: (cancellation) => askers.openApproval(cancellation),
        userQuestion: (cancellation) => askers.userQuestion(cancellation),
      },
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
  | 'onCommandRun'
  | 'onWarning'
  | 'onStep'
  | 'onAnswer'
  | 'onTargetNoteChanged'
  | 'onOpenRequested'
  | 'onQuestionAsked'
  | 'onTurnFinished'
  | 'onTurnFailed'
>
