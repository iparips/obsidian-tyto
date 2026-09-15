import { App } from 'obsidian'
import { ActiveNote } from './active-note'
import { AgentsMdRepository } from '../agents/agents-md-repository'
import { SkillRepository } from '../skills/skill-repository'
import { TytoSettings } from '../settings/settings'

// What outlives one session: the vault, the live settings, and the two
// repositories built from them. Settings arrive as a read rather than a value,
// since the settings tab replaces the object the plugin holds.
export class PluginScope {
  constructor(
    readonly app: App,
    private readonly readSettings: () => TytoSettings,
  ) {}

  get settings(): TytoSettings {
    return this.readSettings()
  }

  // A method rather than a field for the same reason settings are: it reads
  // settings.skillsPath, so a field would snapshot the path the user edits.
  skillRepository(): SkillRepository {
    return new SkillRepository(this.app.vault.adapter, this.settings.skillsPath)
  }

  agentsMdRepository(): AgentsMdRepository {
    return new AgentsMdRepository(this.app.vault.adapter)
  }

  activeNote(): ActiveNote {
    return new ActiveNote(this.app)
  }
}
