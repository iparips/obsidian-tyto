import { Skill } from '../skills/skill'
import { RuleBuilder } from './rule-builder'
import { NoteDetails } from './models/note-details'
import { AgentsMdChain } from '../agents/agents-md-chain'
import { AgentsMdFile } from '../agents/agents-md-file'
import { AllowedCommand } from '../commands/models/allowed-command'
import { ChatMessage } from '../providers/types'

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

  private static standingRulesText(
    skills: readonly Skill[],
    instructions: AgentsMdChain,
    commands: readonly AllowedCommand[],
    searchEnabled: boolean,
  ): string {
    return [
      RuleBuilder.roleRules(),
      RuleBuilder.dictationRules(),
      ...PromptBuilder.instructionSection(instructions),
      ...PromptBuilder.skillSection(skills),
      ...PromptBuilder.commandSection(commands),
      ...PromptBuilder.searchSection(searchEnabled),
    ].join('\n\n')
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

  // Omitted entirely when the catalogue is empty, so a vault without skills
  // produces the three-section prompt byte for byte (FR38).
  private static skillSection(skills: readonly Skill[]): string[] {
    if (skills.length === 0) return []
    return [[PromptBuilder.skillRules(), ...PromptBuilder.skillLines(skills)].join('\n')]
  }

  static skillRules(): string {
    return [
      'This vault defines the skills below. When an utterance matches one, follow its',
      'workflow rather than improvising.',
      'Your tools edit the open note and nothing else. Follow a skill only while its',
      'steps stay inside that note.',
      "Call load_skill to read a skill's steps before following it; the line below is only a summary.",
      'When a matching skill needs to read or write another file, name the skill, say',
      'that editing other files is not supported yet, and make no partial edit.',
    ].join('\n')
  }

  private static skillLines(skills: readonly Skill[]): string[] {
    return skills.map((skill) => `${skill.name} - ${skill.description}`)
  }

  // Re-read from the editor every turn. Anything the conversation says about
  // the note is a record of an earlier state, including the user's own manual
  // edits between turns, so this copy is the only current one.
  static noteSnapshot(note: NoteDetails): ChatMessage {
    return ChatMessage.system(PromptBuilder.noteSnapshotText(note))
  }

  private static noteSnapshotText(note: NoteDetails): string {
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
