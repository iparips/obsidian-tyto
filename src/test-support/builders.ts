import { ChatTurn, ToolCall } from '../providers/types'
import { EditApplier } from '../engine/edit-applier'
import { OpenNote } from '../engine/edit-engine'
import { FakeEditor } from './fake-editor'

let nextCallId = 0

export const aToolCall = (name: string, args: Record<string, unknown>): ToolCall => ({
  id: `call-${nextCallId++}`,
  name,
  args,
})

export const aToolTurn = (...calls: ToolCall[]): ChatTurn => ChatTurn.ofToolCalls(calls)

export const aTextTurn = (content: string): ChatTurn => ChatTurn.ofText(content)

export const anOpenNote = (editor: FakeEditor, path = 'note.md'): OpenNote => ({
  applier: new EditApplier(editor.asEditor(), editor.getCursor()),
  context: () => ({ path, content: editor.getValue(), cursorLine: editor.getCursor().line }),
})
