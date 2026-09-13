import { APPLICABLE_SKILLS, ToolCall } from '../../model/providers/models/tool-call'
import { Skill } from '../../skills/skill'

// The skills one call declared cover its utterance, checked against what the
// vault defines and what this session has read. The harness never decides which
// skill fits: it holds the model to the names it chose itself.
export class SkillDeclaration {
  private constructor(
    private readonly declared: boolean,
    private readonly names: readonly string[],
  ) {}

  // Read off the raw argument as well as its contents, because a declared [] and
  // an omitted argument both arrive as an empty array and say different things.
  static from(call: ToolCall): SkillDeclaration {
    return new SkillDeclaration(
      call.declaresArgument(APPLICABLE_SKILLS),
      call.stringsArgument(APPLICABLE_SKILLS),
    )
  }

  // The reason to refuse this call, or null when it may proceed. Named skills
  // are checked against the vault before the session, so a typo is answered with
  // the list rather than told to load something that does not exist.
  getRefusalAgainstVaultAndSession(
    vaultSkills: readonly Skill[],
    hasRead: (name: string) => boolean,
  ): string | null {
    if (!this.declared) return SkillDeclaration.MISSING_ARGUMENT
    const unknown = this.getNamesMissingFromVault(vaultSkills)
    if (unknown.length > 0) return SkillDeclaration.buildUnknownNamesRefusal(unknown, vaultSkills)
    const unread = this.names.filter((name) => !hasRead(name))
    if (unread.length > 0) return SkillDeclaration.buildUnreadNamesRefusal(unread)
    return null
  }

  private getNamesMissingFromVault(vaultSkills: readonly Skill[]): string[] {
    const defined = vaultSkills.map((skill) => skill.name)
    return this.names.filter((name) => !defined.includes(name))
  }

  static readonly MISSING_ARGUMENT =
    'this vault defines skills, so every call that reaches it must send applicable_skills: the names covering this utterance, or [] when none does'

  // Lists what the vault defines, so a model that guessed a name has the real
  // ones in front of it rather than having to search for them again.
  private static buildUnknownNamesRefusal(
    unknown: readonly string[],
    vaultSkills: readonly Skill[],
  ): string {
    const defined = vaultSkills.map((skill) => skill.name).join(', ')
    return `no skill in this vault is named ${unknown.join(', ')}; this vault defines ${defined}`
  }

  // Names what to load rather than asking the model to work it out: a refusal
  // that only reports the block is one the model answers by retrying.
  private static buildUnreadNamesRefusal(unread: readonly string[]): string {
    return `load ${unread.join(', ')}, then call this again declaring it`
  }
}
