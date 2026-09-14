import { LoadedSkills } from './loaded-skills'
import { TextDiff } from './models/text-diff'
import { PartName, TranscriptPart } from './models/transcript-record'

const PART_HEADINGS: Record<PartName, string> = {
  systemPrompt: 'System prompt',
  dateMessage: 'Date message',
  sessionTarget: 'Note context',
}

// Each part written once under its version, so twenty repeated steps cost one
// copy of the prompt rather than twenty. The steps above cite these by version.
export class TranscriptAppendix {
  static write(parts: readonly TranscriptPart[], skills: LoadedSkills): string[] {
    return [...TranscriptAppendix.promptParts(parts), ...TranscriptAppendix.skills(skills)]
  }

  private static promptParts(parts: readonly TranscriptPart[]): string[] {
    if (parts.length === 0) return []
    return [
      '## Appendix: prompt parts',
      '',
      'Each part is written once here and cited by version from the turn steps above.',
      '',
      ...parts.flatMap((part) =>
        TranscriptAppendix.part(part, TranscriptAppendix.before(part, parts)),
      ),
    ]
  }

  // A skill body reaches the model as a tool result, so inlining it would put
  // several hundred words in the step that loaded it and again in every step
  // after, which the history carries it through.
  private static skills(skills: LoadedSkills): string[] {
    if (skills.isEmpty()) return []
    return [
      '## Appendix: skills loaded',
      '',
      'Each body is written once here and cited from the turn step that loaded it.',
      '',
      ...skills.names().flatMap((name) => TranscriptAppendix.skill(name, skills.bodyOf(name))),
    ]
  }

  private static skill(name: string, body: string): string[] {
    return [`### Skill ${name}`, '', ...TranscriptAppendix.fenced(body, 'text'), '']
  }

  // The version before this one of the same part. The list runs in first-sent
  // order across all three parts, so a note context v2 can sit several entries
  // after the v1 it changed from.
  private static before(
    part: TranscriptPart,
    parts: readonly TranscriptPart[],
  ): TranscriptPart | undefined {
    return parts.find((each) => each.name === part.name && each.version === part.version - 1)
  }

  // Fenced as text rather than markdown: a note's own fences would close a
  // markdown fence early and the rest of the transcript would render as prose.
  // A later version is written as a diff: the note context is re-read from the
  // editor every step, so one edited line would otherwise write the note again.
  private static part(part: TranscriptPart, against: TranscriptPart | undefined): string[] {
    const heading = `### ${PART_HEADINGS[part.name]} v${part.version}`
    if (!against) return [heading, '', ...TranscriptAppendix.fenced(part.text, 'text'), '']
    return [
      heading,
      '',
      `Changed from v${against.version}:`,
      '',
      ...TranscriptAppendix.fenced(
        TextDiff.between(against.text, part.text).trimmed().join('\n'),
        'diff',
      ),
      '',
    ]
  }

  private static fenced(body: string, language: string): string[] {
    const fence = TranscriptAppendix.fenceFor(body)
    return [`${fence}${language}`, body, fence]
  }

  // One backtick longer than the longest run the body itself holds, so a note
  // quoting a fenced block cannot close this one early. A diff indents every
  // line it keeps, so the run is matched past any leading spaces.
  private static fenceFor(text: string): string {
    const longest = [...text.matchAll(/^ *`{3,}/gm)].reduce(
      (most, match) => Math.max(most, match[0].trim().length),
      2,
    )
    return '`'.repeat(longest + 1)
  }
}
