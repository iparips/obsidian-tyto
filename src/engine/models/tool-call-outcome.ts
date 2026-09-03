import { EditorPosition } from 'obsidian'

// editedTo is absent when the call changed nothing, so the turn keeps the
// position of the last call that did.
export interface ToolCallOutcome {
  result: string
  editedTo?: EditorPosition
}
