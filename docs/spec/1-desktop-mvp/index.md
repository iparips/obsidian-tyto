# Desktop MVP: Detailed Design

Implementable spec for release 1 of [2-plan.md](../2-plan.md). High-level design: [architecture/1-desktop-mvp.md](../../architecture/1-desktop-mvp.md). Tech stack: bun, TypeScript, React 19, vitest with happy-dom.

The release is built apart from vault skills (FR34-38). These files describe working code; [6-implementation-order.md](6-implementation-order.md) carries the outstanding delta.

- [1-architecture-overview.md](1-architecture-overview.md) - source tree, dependency rules, tech stack
- [2-data-model.md](2-data-model.md) - shared contracts: Outcome, provider interfaces, operations, settings
- [3-component-design.md](3-component-design.md) - tool schemas, system prompt, agent loop, anchor resolution, recorder
- [4-settings-ui.md](4-settings-ui.md) - SessionPanel state machine, session binding, SettingsPanel
- [5-testing-strategy.md](5-testing-strategy.md) - test outline per component
- [6-implementation-order.md](6-implementation-order.md) - what is built, and the steps left for vault skills
