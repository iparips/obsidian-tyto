---
created: 2026-09-14
updated: 2026-09-14
---

# PluginScope

The shape commit 2 builds. Every other commit in this spec is a move; this one
adds a class, so its target is written out rather than left to be invented.

Settings are the constraint. main.ts calls engineFactory() once per session and
reads this.settings each time, while updateSettings replaces that object when
the user edits the settings tab. A scope holding a settings snapshot would
freeze them at plugin load, which is a behaviour change.

So the scope reads settings through a function rather than holding a value:

```ts
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

  skillRepository(): SkillRepository {
    return new SkillRepository(this.app.vault.adapter, this.settings.skillsPath)
  }

  agentsMdRepository(): AgentsMdRepository {
    return new AgentsMdRepository(this.app.vault.adapter)
  }
}
```

The two repository methods move across from main.ts unchanged, which is where
they sit today. They stay methods rather than fields for the same reason
settings do: skillRepository reads settings.skillsPath, so a field would
snapshot it.

EngineFactory's constructor then takes one argument instead of four:

```ts
export class EngineFactory {
  constructor(private scope: PluginScope) {}
}
```

Its body substitutes this.scope.app for this.app, this.scope.settings for
this.settings, and calls the two repository methods where it read the fields.
Nothing else in the class changes, and build keeps its signature.

main.ts builds the scope once at load and hands it to each factory:

```ts
private pluginScope = new PluginScope(this.app, () => this.settings)

private engineFactory(): EngineFactory {
  return new EngineFactory(this.pluginScope)
}
```

skillRepository and agentsMdRepository then come off main.ts, since the scope
owns them. Nothing else calls them.

One test constructs EngineFactory directly: session-builder.test.ts passes a
cast App, DEFAULT_SETTINGS and two repositories built on a FakeAdapter. It
becomes a PluginScope built on the same fake, which is a shorter arrangement
than the one it replaces:

```ts
const scope = new PluginScope(
  { vault: { adapter: adapter.asAdapter() } } as App,
  () => DEFAULT_SETTINGS,
)
const engineFactory = new EngineFactory(scope)
```

The test then builds the two repositories through the scope rather than by hand,
which is the same pair it built before. This is the only test the commit
touches, and it is an arrangement change rather than an assertion change.
