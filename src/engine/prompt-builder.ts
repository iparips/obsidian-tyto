import { Skill } from '../skills/skill'
import { RuleBuilder } from './rule-builder'
import { NoteContext } from './models/note-context'

export class PromptBuilder {
  // The note itself is not here: EditEngine sends it as the last message, so the
  // current copy sits after every stale one in the conversation.
  static build(note: NoteContext, skills: readonly Skill[] = []): string {
    return [
      RuleBuilder.roleRules(),
      RuleBuilder.dictationRules(),
      ...PromptBuilder.skillSection(skills),
    ].join('\n\n')
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
  static context(note: NoteContext): string {
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
