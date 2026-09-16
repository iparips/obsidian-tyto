import { PanelItem } from './models/panel-state'
import { SessionRepository } from './session-repository'
import {
  SESSION_SNAPSHOT_VERSION,
  SessionSnapshot,
  StoredMessages,
} from './models/session-snapshot'

// Gathers the snapshot from the two halves that hold a session: the repository
// the model reads, and the entries the panel shows. A service rather than a
// method on the snapshot, because the snapshot crosses a file boundary and a
// value there must not reach a store.
//
// The transcript is deliberately absent. It carries every prompt and note
// excerpt verbatim, which NFR2 keeps off disk, so a restored session copies a
// thinner transcript than one that never went away.
export class SessionSnapshotFactory {
  // The clock is the caller's, so a test reads a stamp it chose rather than the
  // one the machine happened to have.
  static of(
    sessions: SessionRepository,
    entries: readonly PanelItem[],
    writtenAt: Date = new Date(),
  ): SessionSnapshot {
    return {
      version: SESSION_SNAPSHOT_VERSION,
      targetPath: sessions.targetNote(),
      messages: sessions.chatHistory().map((message) => StoredMessages.of(message)),
      // The restored line is dropped rather than stored: restore adds one, so
      // storing it would stack a second on the next restore and a third after
      // that. It says where this session came back, not where the last one did.
      entries: entries.filter((entry) => entry.kind !== 'restored'),
      writtenAt: writtenAt.getTime(),
    }
  }
}
