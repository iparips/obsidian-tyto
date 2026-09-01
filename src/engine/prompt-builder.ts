import { EMPTY_CATALOGUE, SkillCatalogue } from '../skills/skill-catalogue'

export interface NoteContext {
  path: string
  content: string
  cursorLine: number
}

export class PromptBuilder {
  static build(note: NoteContext, skills: SkillCatalogue = EMPTY_CATALOGUE): string {
    return [
      PromptBuilder.roleRules(),
      PromptBuilder.dictationRules(),
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
      'When a matching skill needs to read or write another file, name the skill, say',
      'that editing other files is not supported yet, and make no partial edit.',
    ].join('\n')
  }

  private static skillLines(skills: SkillCatalogue): string[] {
    return skills.map((skill) => `${skill.name} - ${skill.description}`)
  }

  private static roleRules(): string {
    return [
      'You edit one markdown note through the provided tools.',
      'Never rewrite the whole note; make the smallest targeted edits that satisfy the instruction.',
      'If the instruction is ambiguous, respond with a clarifying question instead of guessing.',
      'Multi-part instructions become multiple tool calls, applied in order.',
      'When you are done, respond with a one-sentence summary of what changed.',
    ].join('\n')
  }

  private static dictationRules(): string {
    return [
      'The user speaks utterances that are content to write down, an editing instruction, or a mix. Classify each utterance and act accordingly.',
      'For content: drop filler words, fix punctuation and capitalisation, and resolve self-corrections such as "no, not X, Y".',
      'Format content to fit the note: prose stays prose, enumerations become markdown lists, spoken structure cues become headings.',
      'Infer formatting intent from natural phrasing; there are no fixed trigger phrases.',
      'Content goes at the cursor unless the utterance directs it elsewhere.',
    ].join('\n')
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
