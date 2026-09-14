import { PanelEntry } from './models/panel-state'
import { SessionRepository } from './session-repository'
import { SessionSnapshotFactory } from './session-snapshot-factory'
import { SessionStore } from './session-store'

// Writes the record whenever the panel's history changes, so what was shown is
// what is on disk. Session-scoped and outside React, which is the whole point:
// an unmount stops the effects that used to reach the write, and leaves this
// holding exactly what the panel last showed.
export class SessionRecorder {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly store: SessionStore,
  ) {}

  // The entries as they now stand rather than the newest one: a later action
  // rewrites an earlier entry, so the record is a snapshot and never a log.
  // Not awaited, because the write is already fire and forget and the turn that
  // produced these entries has already happened (NFR3).
  record(entries: readonly PanelEntry[]): void {
    void this.store.write(SessionSnapshotFactory.of(this.sessions, entries))
  }
}
