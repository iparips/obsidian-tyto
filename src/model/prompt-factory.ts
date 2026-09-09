import { Skill } from '../skills/skill'
import { RuleBuilder } from './rule-builder'
import { NoteDetails } from '../engine/note-editing/note-details'
import { AgentsMdChain } from '../agents/agents-md-chain'
import { AgentsMdFile } from '../agents/agents-md-file'
import { AllowedObsidianCommand } from '../commands/models/allowed-obsidian-command'
import { ChatMessage } from './providers/types'
import { Today } from './today'

export class PromptFactory {
  // The note itself is not here: EditEngine sends it as the last message, so the
  // current copy sits after every stale one in the conversation.
  static standingRules(
    vaultDefinesSkills = false,
    instructions: AgentsMdChain = new AgentsMdChain(),
    commands: readonly AllowedObsidianCommand[] = [],
    searchEnabled = false,
  ): ChatMessage {
    return ChatMessage.system(
      PromptFactory.standingRulesText(vaultDefinesSkills, instructions, commands, searchEnabled),
    )
  }

  // Next to last, where a stale copy is least likely to win: a date the model
  // reads off a note name is a mistake the freshest position prevents.
  static date(today: Today = Today.of()): ChatMessage {
    return ChatMessage.system(PromptFactory.dateLine(today))
  }

  // Its own message rather than a paragraph inside another, so the names the
  // model must match the utterance against are not read as a footnote to
  // whatever it was appended to.
  // Null when the vault defines none, so the mapper sends no empty message.
  static skillCatalogue(skills: readonly Skill[] = []): ChatMessage | null {
    if (skills.length === 0) return null
    return ChatMessage.system(
      [
        'This vault defines these skills. Match the user against them before you act:',
        ...PromptFactory.skillLines(skills),
      ].join('\n'),
    )
  }

  // Last when no note is bound, so what the model can do next takes the position
  // the note would have had.
  static unboundContext(canRunCommands = false, canSearch = false): ChatMessage {
    return ChatMessage.system(
      [
        'No note is open, so this session is not bound to one yet.',
        'Every tool but the editing ones still works: only writing needs a note.',
        'The editing tools have nothing to write to until a note opens.',
        ...PromptFactory.noNoteEditRules(canRunCommands, canSearch),
        'The session binds to the first note that opens, however it opens.',
      ].join('\n'),
    )
  }

  // A note the user names is reachable once a command can open one, so asking
  // them to open it is stated only while it is still the only move.
  private static noNoteEditRules(canRunCommands: boolean, canSearch: boolean): string[] {
    const routes = PromptFactory.noteRoutes(canRunCommands, canSearch)
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
  private static noteRoutes(canRunCommands: boolean, canSearch: boolean): string[] {
    return [
      canRunCommands ? 'run the command that opens the note they named' : '',
      canSearch ? 'search for it and open what they choose' : '',
    ].filter(Boolean)
  }

  private static standingRulesText(
    vaultDefinesSkills: boolean,
    instructions: AgentsMdChain,
    commands: readonly AllowedObsidianCommand[],
    searchEnabled: boolean,
  ): string {
    return [
      RuleBuilder.roleRules(PromptFactory.reachOf(commands, searchEnabled)),
      RuleBuilder.dictationRules(),
      ...PromptFactory.instructionSection(instructions),
      ...PromptFactory.skillSection(vaultDefinesSkills, commands.length > 0),
      ...PromptFactory.commandSection(commands),
      ...PromptFactory.searchSection(searchEnabled),
      ...PromptFactory.questionSection(commands.length > 0, searchEnabled),
    ].join('\n\n')
  }

  private static reachOf(
    commands: readonly AllowedObsidianCommand[],
    searchEnabled: boolean,
  ): string {
    if (commands.length === 0 && !searchEnabled) return RuleBuilder.SINGLE_NOTE_REACH
    return RuleBuilder.widenedReach(commands.length > 0, searchEnabled)
  }

  // Omitted entirely when the catalogue is empty, so a vault allowing no
  // commands produces the release 3 prompt byte for byte (NFR8).
  private static commandSection(commands: readonly AllowedObsidianCommand[]): string[] {
    if (commands.length === 0) return []
    return [[RuleBuilder.commandRules(), ...PromptFactory.commandLines(commands)].join('\n')]
  }

  // The id first and the name after, since the id is what run_command takes.
  // The separator is wide enough to read as a break rather than as part of
  // either half.
  private static commandLines(commands: readonly AllowedObsidianCommand[]): string[] {
    return commands.map((command) => `${command.id} - ${command.name}`)
  }

  private static searchSection(searchEnabled: boolean): string[] {
    return searchEnabled ? [RuleBuilder.searchRules()] : []
  }

  // Omitted where no route exists to exhaust, so a vault with neither flow
  // produces the release 3 prompt byte for byte (NFR7).
  private static questionSection(canRunCommands: boolean, searchEnabled: boolean): string[] {
    if (!canRunCommands && !searchEnabled) return []
    return [RuleBuilder.questionRules()]
  }

  // Omitted entirely when no folder holds instructions, so a vault with neither
  // filename produces the release 2 prompt byte for byte (FR11).
  private static instructionSection(chain: AgentsMdChain): string[] {
    if (chain.isEmpty()) return []
    return [[RuleBuilder.instructionRules(), ...PromptFactory.instructionBlocks(chain)].join('\n')]
  }

  private static instructionBlocks(chain: AgentsMdChain): string[] {
    return chain.files.map((file) => PromptFactory.instructionBlock(file))
  }

  private static instructionBlock(file: AgentsMdFile): string {
    return [
      `Instructions from ${file.label()} (${file.fileName}):`,
      '```markdown',
      file.contents.trim(),
      '```',
    ].join('\n')
  }

  // How a skill works, never which ones exist: the names live in the catalogue
  // message, late, because a trigger phrase the model reads last is one it
  // still has in mind when it decides what to do.
  // Omitted entirely when the vault defines none, so a vault without skills
  // produces the three-section prompt byte for byte (FR38).
  private static skillSection(vaultDefinesSkills: boolean, canLeaveNote: boolean): string[] {
    if (!vaultDefinesSkills) return []
    return [PromptFactory.skillRules(canLeaveNote)]
  }

  static skillRules(canLeaveNote = false): string {
    return [
      'This vault defines skills, listed by name in a later message. When an utterance',
      'matches one, follow its workflow rather than improvising.',
      "Call load_skill to read a skill's steps before following it; the line below is only a summary.",
      'Answer the skill question before your first edit: call load_skill for the one',
      'that covers this, or no_skill_applies when none does. Loading a skill has already',
      'answered it, so never call no_skill_applies in a turn where you loaded one.',
      'You decide which applies; the edit tools refuse until you have said. The summary',
      'says when a skill applies, never how to carry it out, so editing without loading',
      'it skips steps silently.',
      'Reaching the right note is not the same as doing the work. If a skill matched,',
      'follow its steps even when a command has already opened the note it names.',
      'A skill that says it MUST load for a kind of file is not a judgement call: load',
      'it whenever you are about to write to a file of that kind. When a skill lists a',
      'folder or a kind of note, the note you are about to edit being one of them is a',
      'match, whatever words the user used.',
      ...PromptFactory.skillReachRules(canLeaveNote),
    ].join('\n')
  }

  // A skill that names another note is reachable once a command can open one,
  // so the refusal is stated only while it is still true.
  private static skillReachRules(canLeaveNote: boolean): string[] {
    if (!canLeaveNote)
      return [
        'Your tools edit the open note and nothing else. Follow a skill only while its',
        'steps stay inside that note.',
        'When a matching skill needs to read or write another file, name the skill, say',
        'that editing other files is not supported yet, and make no partial edit.',
      ]
    return [
      'When a skill names a note other than the open one, run the command that opens it',
      'before editing. Only decline if no listed command reaches that note.',
    ]
  }

  private static skillLines(skills: readonly Skill[]): string[] {
    return skills.map((skill) => `${skill.name} - ${skill.description}`)
  }

  // Sent near the note rather than with the standing rules, because it goes
  // stale the same way the note does: the chat history holds yesterday's copy,
  // and this is the only current one.
  private static dateLine(today: Today): string {
    return [
      `Today is ${today.describe()}.`,
      'Resolve every relative date in the instruction against it, never against',
      'a date in the conversation or a note name. A note named for a date is not',
      'evidence of what today is.',
    ].join('\n')
  }

  // Last, and re-read from the editor every turn. Anything the conversation says
  // about the note is a record of an earlier state, including the user's own
  // manual edits between turns, so this copy is the only current one.
  static noteContext(note: NoteDetails): ChatMessage {
    return ChatMessage.system(PromptFactory.noteContextText(note))
  }

  private static noteContextText(note: NoteDetails): string {
    return [
      `Note path: ${note.path}`,
      `Cursor line: ${note.cursor.line}`,
      'This is the note as it is right now, re-read from the editor. It supersedes any',
      'earlier copy or description in this conversation, including your own. The user may',
      'have edited it since the last turn. Never answer from an earlier copy.',
      'Note content:',
      '```markdown',
      note.content,
      '```',
    ].join('\n')
  }
}
