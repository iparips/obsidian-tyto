import { EMPTY_CATALOGUE, SkillCatalogue } from '../skills/skill-catalogue'
import { EditingRules } from './editing-rules'

export interface NoteContext {
  path: string
  content: string
  cursorLine: number
}

export class PromptBuilder {
  static build(note: NoteContext, skills: SkillCatalogue = EMPTY_CATALOGUE): string {
    return [
      EditingRules.roleRules(),
      EditingRules.dictationRules(),
      ...PromptBuilder.skillSection(skills),
      PromptBuilder.context(note),
    ].join('\n\n')
  }

  // Omitted entirely when the catalogue is empty, so a vault without skills
  // produces the three-section prompt byte for byte (FR38).
  private static skillSection(skills: SkillCatalogue): string[] {
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

  private static skillLines(skills: SkillCatalogue): string[] {
    return skills.map((skill) => `${skill.name} - ${skill.description}`)
  }

  private static context(note: NoteContext): string {
    return [
      `Note path: ${note.path}`,
      `Cursor line: ${note.cursorLine}`,
      'Note content:',
      '```markdown',
      note.content,
      '```',
    ].join('\n')
  }
}
