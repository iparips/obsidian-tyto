import { ToolCall } from '../providers/types'
import { EditOperation } from './note-editor'
import { Attempt, Outcomes } from '../shared/models/outcome'

export type NoteOperation = Attempt<EditOperation>

const LOCATIONS: Record<string, 'noteStart' | 'noteEnd' | 'cursor'> = {
  note_start: 'noteStart',
  note_end: 'noteEnd',
  cursor: 'cursor',
}

export class NoteOperationParser {
  static parse(call: ToolCall): NoteOperation {
    if (call.name === 'replace_text') return NoteOperationParser.parseReplace(call.args)
    if (call.name === 'insert_text') return NoteOperationParser.parseInsert(call.args)
    if (call.name === 'insert_at') return NoteOperationParser.parseInsertAt(call.args)
    return Outcomes.failure('apply', `unknown tool ${call.name}`)
  }

  private static parseReplace(args: Record<string, unknown>): NoteOperation {
    const anchor = args.anchor_text
    const replacement = args.replacement
    if (typeof anchor !== 'string' || typeof replacement !== 'string')
      return Outcomes.failure('apply', 'anchor_text and replacement must be strings')
    return Outcomes.success({ kind: 'replace', anchor, replacement })
  }

  private static parseInsert(args: Record<string, unknown>): NoteOperation {
    const anchor = args.anchor_text
    const position = args.position
    const content = args.content
    if (typeof anchor !== 'string' || typeof content !== 'string')
      return Outcomes.failure('apply', 'anchor_text and content must be strings')
    if (position !== 'before' && position !== 'after')
      return Outcomes.failure('apply', 'position must be before or after')
    return Outcomes.success({ kind: 'insert', anchor, position, content })
  }

  private static parseInsertAt(args: Record<string, unknown>): NoteOperation {
    const location = typeof args.location === 'string' ? LOCATIONS[args.location] : undefined
    const content = args.content
    if (typeof content !== 'string') return Outcomes.failure('apply', 'content must be a string')
    if (!location)
      return Outcomes.failure('apply', 'location must be note_start, note_end or cursor')
    return Outcomes.success({ kind: 'insertAt', location, content })
  }
}
