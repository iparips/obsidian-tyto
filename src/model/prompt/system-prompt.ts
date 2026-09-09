import { AgentsMdChain } from '../../agents/agents-md-chain'
import { Skill } from '../../skills/skill'
import { AllowedObsidianCommand } from '../../commands/models/allowed-obsidian-command'
import { ChatMessage } from '../providers/types'
import { CommandSection } from './system-prompt-sections/command-section'
import { DictationSection } from './system-prompt-sections/dictation-section'
import { ModelsRole } from './system-prompt-sections/models-role'
import { QuestionSection } from './system-prompt-sections/question-section'
import { SearchSection } from './system-prompt-sections/search-section'
import { SkillSection } from './system-prompt-sections/skill-section'
import { VaultInstructions } from './system-prompt-sections/vault-instructions'

// The system prompt: what the model is, what it may do, and what this vault
// says, all fixed before the conversation starts.
// Not every system-role message belongs here. The date and the note are sent
// after the history instead, because the history holds a stale copy of both and
// only the last one read wins. What is here cannot go stale that way.
// VaultInstructions is the exception to that rule rather than to this one: the
// chain is turn-scoped, but its blocks are quoted vault content and the rules
// fencing them off hold only while they sit above the quote.
// Each section owns its own text and decides whether it appears at all, so this
// only puts them in order.
export class SystemPrompt {
  static build(
    agentsMdChain: AgentsMdChain = new AgentsMdChain(),
    commands: readonly AllowedObsidianCommand[] = [],
    skills: readonly Skill[] = [],
    searchEnabled = false,
  ): ChatMessage {
    return ChatMessage.system(
      [
        ModelsRole.build(commands, searchEnabled),
        DictationSection.build(),
        ...VaultInstructions.build(agentsMdChain),
        ...SkillSection.build(skills),
        // Stated after whatever the vault says, so the rules the model reads
        // last about its own reach are the harness's rather than a note's.
        ...CommandSection.build(commands),
        ...SearchSection.build(searchEnabled),
        ...QuestionSection.build(commands.length > 0, searchEnabled),
      ].join('\n\n'),
    )
  }
}
