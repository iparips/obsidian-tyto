import { TranscriptSource } from './models/transcript-source'

// The table opening the transcript. The settings are here because they decide
// which sections the system prompt carries, so a transcript read months later
// says what the model was working with. The API key is never one of them.
export class TranscriptMetadata {
  static write(source: TranscriptSource): string[] {
    return [
      '## Session metadata',
      '',
      '| Field | Value |',
      '| --- | --- |',
      ...TranscriptMetadata.rows(source).map(([field, value]) => `| ${field} | ${value} |`),
    ]
  }

  private static rows(source: TranscriptSource): [string, string][] {
    const { session, settings } = source
    return [
      ['Copied', TranscriptMetadata.stamp(session.copiedAt)],
      ['Plugin', `Owl ${session.pluginVersion}`],
      ['Note', session.notePath ?? 'no note open'],
      ['Model', settings.editModel],
      ['Search', settings.searchEnabled ? 'enabled' : 'disabled'],
      ['Open', settings.openMode],
      ['Skills', settings.skillsPath || 'disabled'],
      ['Commands', TranscriptMetadata.commands(settings.commandAllowList)],
      ['Turns', TranscriptMetadata.turns(source)],
    ]
  }

  private static commands(allowList: readonly string[]): string {
    return allowList.length === 0 ? 'none' : allowList.join(', ')
  }

  private static turns(source: TranscriptSource): string {
    const turns = source.entries.filter((entry) => entry.kind === 'user').length
    return `${TranscriptMetadata.count(turns, 'conversation turn')}, ${TranscriptMetadata.count(source.steps.length, 'turn step')}`
  }

  private static count(total: number, noun: string): string {
    return `${total} ${noun}${total === 1 ? '' : 's'}`
  }

  // Local time, since a session is read against the day the user had it rather
  // than against UTC.
  private static stamp(at: Date): string {
    const date = [at.getFullYear(), at.getMonth() + 1, at.getDate()]
      .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0'))
      .join('-')
    const time = [at.getHours(), at.getMinutes()]
      .map((part) => String(part).padStart(2, '0'))
      .join(':')
    return `${date} ${time}`
  }
}
