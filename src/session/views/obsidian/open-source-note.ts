import { App } from 'obsidian'
import { OpenSourceNoteFn } from '../open-source-note'

// openLinkText rather than resolving the path to a TFile and opening it: it is
// what Obsidian's own links use, so a source behaves the way a link in a note
// behaves, including the modifier keys that open in a split or a new tab.
//
// The second argument is the note a relative link would resolve against, and a
// source path is already from the vault root, so it is empty. The third asks
// for a new leaf where the user's modifier says so rather than always.
export const openSourceNote =
  (app: App): OpenSourceNoteFn =>
  (path) => {
    void app.workspace.openLinkText(path, '', false)
  }
