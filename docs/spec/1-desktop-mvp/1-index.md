# Desktop MVP: Detailed Design

Implementable spec for release 1 of [2-plan.md](../2-plan.md). High-level design: [architecture/1-desktop-mvp.md](../../architecture/1-desktop-mvp.md). Tech stack: bun, TypeScript, React 19, vitest with happy-dom.

The release is built apart from vault skills (FR34-38). These files describe working code; [7-implementation-order.md](7-implementation-order.md) carries the outstanding delta.

- [2-architecture-overview.md](2-architecture-overview.md) - source tree, dependency rules, tech stack
- [3-data-model.md](3-data-model.md) - shared contracts: Outcome, provider interfaces, operations, settings
- [4-component-design.md](4-component-design.md) - tool schemas, system prompt, agent loop, anchor resolution, recorder
- [5-settings-ui.md](5-settings-ui.md) - SessionPanel state machine, session binding, SettingsPanel
- [6-testing-strategy.md](6-testing-strategy.md) - test outline per component
- [7-implementation-order.md](7-implementation-order.md) - what is built, and the steps left for vault skills
