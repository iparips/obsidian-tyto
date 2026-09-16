import { Skill } from '../../../skills/skill'

// How a skill works and which ones exist, together: the rules mean nothing
// without the names, and the names are what an utterance is matched against.
export class SkillSection {
  // Omitted entirely when the vault defines none, so a vault without skills
  // produces the three-section prompt byte for byte (FR38).
  static build(skills: readonly Skill[]): string[] {
    if (skills.length === 0) return []
    return [[SkillSection.rules(), ...SkillSection.catalogue(skills)].join('\n')]
  }

  static rules(): string {
    return [
      'This vault defines the skills listed below. When an utterance',
      'matches one, follow its workflow rather than improvising.',
      "Call load_skill to read a skill's steps before following it; the line below is only a summary.",
      'Every call that reaches the vault names the skills covering the utterance in its',
      'applicable_skills argument. An empty list says none covers it. A skill you name',
      'must be read first, and the refusal says which to load.',
      'A refused declaration names the skill you have not read. Call load_skill with it',
      'and then repeat the call you made; retrying that call first is refused again.',
      'A skill knows where its notes live and how they are named, so a',
      'search you run before loading it is a search built on a guess.',
      'You decide which applies; the tools refuse until you have said. The summary',
      'says when a skill applies, never how to carry it out, so editing without loading',
      'it skips steps silently.',
      'Reaching the right note is not the same as doing the work. If a skill matched,',
      'follow its steps even when a command has already opened the note it names.',
      'A skill that says it MUST load for a kind of file is not a judgement call: load',
      'it whenever you are about to write to a file of that kind. When a skill lists a',
      'folder or a kind of note, the note you are about to edit being one of them is a',
      'match, whatever words the user used.',
      ...SkillSection.reachRules(),
    ].join('\n')
  }

  // What reaches another note is the tool list, not this text: the schemas omit
  // open_note where nothing can open one, and modelsRole already states the
  // single-note limit. So this says what to do rather than what is possible,
  // which is the part no tool enforces.
  private static reachRules(): string[] {
    return [
      'When a skill names a note other than the open one, open it before editing.',
      'If nothing you can do reaches that note, name the skill, say so, and make no',
      'partial edit.',
    ]
  }

  // Name and one-line summary, which is all the model needs to match an
  // utterance; load_skill is what fetches the steps.
  private static catalogue(skills: readonly Skill[]): string[] {
    return [
      '',
      'Match the user against these before you act:',
      ...skills.map((skill) => `${skill.name} - ${skill.description}`),
    ]
  }
}
