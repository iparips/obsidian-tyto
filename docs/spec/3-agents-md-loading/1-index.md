# AGENTS.md Loading: Detailed Design

Implementable spec for release 3 of [2-plan.md](../2-plan.md). High-level design: [architecture/3-agents-md-loading.md](../../architecture/3-agents-md-loading.md). A delta on the
Mobile MVP; unlisted components are unchanged.

Skills give the vault conditional instructions, matched per utterance. This
release adds the unconditional half: instructions that apply to every write to a
note, chosen by where that note sits.

- [2-problem-and-goals.md](2-problem-and-goals.md) - the problem, goals, non-goals and user stories
- [3-functional-requirements.md](3-functional-requirements.md) - the numbered functional and non-functional requirements
- [4-component-design.md](4-component-design.md) - the ancestor walk, prompt assembly and per-target resolution
- [5-budget-and-reporting.md](5-budget-and-reporting.md) - the size cap, and the three channels that report a drop
- [6-decisions.md](6-decisions.md) - choices taken and questions still open
- [7-testing-strategy.md](7-testing-strategy.md) - unit test outline
