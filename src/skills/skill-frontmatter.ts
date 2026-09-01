export class SkillFrontmatter {
  constructor(
    readonly name: string,
    readonly description: string,
  ) {}
}

const BLOCK = /^---\r?\n([\s\S]*?)\r?\n---/
const KEY = /^([A-Za-z0-9_-]+):[ \t]*(?:[|>][-+]?[ \t]*)?(.*)$/

// A regex over the two keys we need, rather than a YAML dependency. Anything
// more structured than a plain or folded scalar needs a real parser.
export class SkillFrontmatterParser {
  static parse(source: string): SkillFrontmatter | null {
    const block = BLOCK.exec(source)
    if (!block) return null
    const lines = block[1].split(/\r?\n/)
    const name = SkillFrontmatterParser.read(lines, 'name')
    if (!name) return null
    return new SkillFrontmatter(name, SkillFrontmatterParser.read(lines, 'description'))
  }

  private static read(lines: string[], key: string): string {
    const start = lines.findIndex((line) => KEY.exec(line)?.[1] === key)
    if (start < 0) return ''
    const parts = [
      KEY.exec(lines[start])?.[2] ?? '',
      ...SkillFrontmatterParser.folded(lines, start),
    ]
    return parts.filter((part) => part.length > 0).join(' ')
  }

  private static folded(lines: string[], start: number): string[] {
    const rest = lines.slice(start + 1)
    const end = rest.findIndex((line) => KEY.test(line))
    return (end < 0 ? rest : rest.slice(0, end)).map((line) => line.trim())
  }
}
