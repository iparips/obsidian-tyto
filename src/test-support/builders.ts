import { ChatTurn, ToolCall } from '../providers/types'
import { EditApplier } from '../engine/edit-applier'
import { OpenNote } from '../engine/edit-engine'
import { NoteContext } from '../engine/note-context'
import { FakeEditor } from './fake-editor'

let nextCallId = 0

export const aToolCall = (name: string, args: Record<string, unknown>): ToolCall =>
  new ToolCall(`call-${nextCallId++}`, name, args)

export const aToolTurn = (...calls: ToolCall[]): ChatTurn => ChatTurn.ofToolCalls(calls)

export const aTextTurn = (content: string): ChatTurn => ChatTurn.ofText(content)

export const anOpenNote = (editor: FakeEditor, path = 'note.md'): OpenNote =>
  new OpenNote(
    new EditApplier(editor.asEditor(), editor.getCursor()),
    () => new NoteContext(path, editor.getValue(), editor.getCursor().line),
  )
