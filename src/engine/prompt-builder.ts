import { Skill } from '../skills/skill'
import { RuleBuilder } from './rule-builder'
import { NoteDetails } from './models/note-details'
import { AgentsMdChain } from '../agents/agents-md-chain'
import { AgentsMdFile } from '../agents/agents-md-file'
import { AllowedCommand } from '../commands/models/allowed-command'
import { ChatMessage } from '../providers/types'
import { Today } from './models/today'

export class PromptBuilder {
  // The note itself is not here: EditEngine sends it as the last message, so the
  // current copy sits after every stale one in the conversation.
  static standingRules(
    skills: readonly Skill[] = [],
    instructions: AgentsMdChain = new AgentsMdChain(),
    commands: readonly AllowedCommand[] = [],
    searchEnabled = false,
  ): ChatMessage {
    return ChatMessage.system(
      PromptBuilder.standingRulesText(skills, instructions, commands, searchEnabled),
    )
  }

  // Stands where the note snapshot stands in a bound turn, so the model reads
  // what it can do in the freshest position rather than a note that is absent.
  static noNoteSnapshot(
    canRunCommands = false,
    today: Today = Today.of(),
    skills: readonly Skill[] = [],
  ): ChatMessage {
    return ChatMessage.system(PromptBuilder.noNoteSnapshotText(canRunCommands, today, skills))
  }

  private static noNoteSnapshotText(
    canRunCommands: boolean,
    today: Today,
    skills: readonly Skill[],
  ): string {
    return [
      PromptBuilder.dateLine(today),
      ...PromptBuilder.skillCatalogue(skills),
      'No note is open, so this session is not bound to one yet.',
      'Every tool but the editing ones still works: only writing needs a note.',
      'The editing tools have nothing to write to until a note opens.',
      ...PromptBuilder.noNoteEditRules(canRunCommands),
      'The session binds to the first note that opens, whether the user opens it or a command does.',
    ].join('\n')
  }

  // A note the user names is reachable once a command can open one, so asking
  // them to open it is stated only while it is still the only move.
  private static noNoteEditRules(canRunCommands: boolean): string[] {
    if (!canRunCommands)
      return [
        'When the user asks for an edit, say that no note is open and ask them to open one,',
        'rather than calling an editing tool.',
      ]
    return [
      'When the user asks for an edit, run the command that opens the note they named, then',
      'edit it. Only ask them to open a note if no listed command reaches it.',
    ]
  }

  private static standingRulesText(
    skills: readonly Skill[],
    instructions: AgentsMdChain,
    commands: readonly AllowedCommand[],
    searchEnabled: boolean,
  ): string {
    return [
      RuleBuilder.roleRules(PromptBuilder.reachOf(commands, searchEnabled)),
      RuleBuilder.dictationRules(),
      ...PromptBuilder.instructionSection(instructions),
      ...PromptBuilder.skillSection(skills, commands.length > 0),
      ...PromptBuilder.commandSection(commands),
      ...PromptBuilder.searchSection(searchEnabled),
      ...PromptBuilder.questionSection(commands.length > 0, searchEnabled),
    ].join('\n\n')
  }

  private static reachOf(commands: readonly AllowedCommand[], searchEnabled: boolean): string {
    if (commands.length === 0 && !searchEnabled) return RuleBuilder.SINGLE_NOTE_REACH
    return RuleBuilder.widenedReach(commands.length > 0, searchEnabled)
  }

  // Omitted entirely when the catalogue is empty, so a vault allowing no
  // commands produces the release 3 prompt byte for byte (NFR8).
  private static commandSection(commands: readonly AllowedCommand[]): string[] {
    if (commands.length === 0) return []
    return [[RuleBuilder.commandRules(), ...PromptBuilder.commandLines(commands)].join('\n')]
  }

  private static commandLines(commands: readonly AllowedCommand[]): string[] {
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
    return [[RuleBuilder.instructionRules(), ...PromptBuilder.instructionBlocks(chain)].join('\n')]
  }

  private static instructionBlocks(chain: AgentsMdChain): string[] {
    return chain.files.map((file) => PromptBuilder.instructionBlock(file))
  }

  private static instructionBlock(file: AgentsMdFile): string {
    return [
      `Instructions from ${file.label()} (${file.fileName}):`,
      '```markdown',
      file.contents.trim(),
      '```',
    ].join('\n')
  }

  // The rules only. The list of skills travels with the note snapshot instead,
  // because a trigger phrase the model reads last is one it still has in mind
  // when it decides what to do.
  // Omitted entirely when the catalogue is empty, so a vault without skills
  // produces the three-section prompt byte for byte (FR38).
  private static skillSection(skills: readonly Skill[], canLeaveNote: boolean): string[] {
    if (skills.length === 0) return []
    return [PromptBuilder.skillRules(canLeaveNote)]
  }

  // Where the skills are actually listed: last, beside the note. The standing
  // rules say how a skill works and this says which ones exist, so the names
  // and their triggers sit in the position the note snapshot was given for the
  // same reason.
  static skillCatalogue(skills: readonly Skill[]): string[] {
    if (skills.length === 0) return []
    return [
      '',
      'This vault defines these skills. Match the user against them before you act:',
      ...PromptBuilder.skillLines(skills),
      '',
    ]
  }

  static skillRules(canLeaveNote = false): string {
    return [
      'This vault defines the skills below. When an utterance matches one, follow its',
      'workflow rather than improvising.',
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
      ...PromptBuilder.skillReachRules(canLeaveNote),
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

  // Sent with the note rather than with the standing rules, because it goes
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

  // Re-read from the editor every turn. Anything the conversation says about
  // the note is a record of an earlier state, including the user's own manual
  // edits between turns, so this copy is the only current one.
  static noteSnapshot(
    note: NoteDetails,
    today: Today = Today.of(),
    skills: readonly Skill[] = [],
  ): ChatMessage {
    return ChatMessage.system(PromptBuilder.noteSnapshotText(note, today, skills))
  }

  private static noteSnapshotText(
    note: NoteDetails,
    today: Today,
    skills: readonly Skill[],
  ): string {
    return [
      PromptBuilder.dateLine(today),
      ...PromptBuilder.skillCatalogue(skills),
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
