import { ChatTurn, ToolCall } from '../providers/types'
import { OpenNote } from '../engine/models/open-note'
import { FakeEditor } from './fake-editor'

let nextCallId = 0

export const aToolCall = (name: string, args: Record<string, unknown>): ToolCall =>
  new ToolCall(`call-${nextCallId++}`, name, args)

export const aToolTurn = (...calls: ToolCall[]): ChatTurn => ChatTurn.ofToolCalls(calls)

export const aTextTurn = (content: string): ChatTurn => ChatTurn.ofText(content)

export const anOpenNote = (editor: FakeEditor, path = 'note.md'): OpenNote =>
  new OpenNote(editor.asEditor(), path, editor.getCursor())
