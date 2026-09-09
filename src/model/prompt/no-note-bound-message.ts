import { ChatMessage } from '../providers/types'

// Takes the position the note would have had, so what the model can do next is
// what it reads last.
export class NoNoteBoundMessage {
  static build(canRunCommands = false, canSearch = false): ChatMessage {
    return ChatMessage.system(
      [
        'No note is open, so this session is not bound to one yet.',
        'Every tool but the editing ones still works: only writing needs a note.',
        'The editing tools have nothing to write to until a note opens.',
        ...NoNoteBoundMessage.editRules(canRunCommands, canSearch),
        'The session binds to the first note that opens, however it opens.',
      ].join('\n'),
    )
  }

  // A note the user names is reachable once a command can open one, so asking
  // them to open it is stated only while it is still the only move.
  private static editRules(canRunCommands: boolean, canSearch: boolean): string[] {
    const routes = NoNoteBoundMessage.routes(canRunCommands, canSearch)
    if (routes.length === 0)
      return [
        'When the user asks for an edit, say that no note is open and ask them to open one,',
        'rather than calling an editing tool.',
      ]
    return [
      `When the user asks for an edit, ${routes.join(', or ')}, then edit it.`,
      'Only ask them to open a note when nothing above reaches it.',
    ]
  }

  // Both routes bind the session, so a vault with search and no commands is not
  // stuck: naming only commands here is what sent it to ask the user instead.
  private static routes(canRunCommands: boolean, canSearch: boolean): string[] {
    return [
      canRunCommands ? 'run the command that opens the note they named' : '',
      canSearch ? 'search for it and open what they choose' : '',
    ].filter(Boolean)
  }
}
