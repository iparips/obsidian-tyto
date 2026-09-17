# Desktop V1: Detailed Design

Implementable spec for the desktop half of milestone D in [plan/5-streaming.md](../../../plan/5-streaming.md). This spec is the design; the architecture docs describe shipped code only. Delta on the Mobile MVP codebase.

- [2-data-model.md](2-data-model.md) - realtime session contracts, auth seam, widened settings
- [3-streaming-capture.md](3-streaming-capture.md) - StreamingTranscriber, audio pipeline, WebSocket handling
- [4-openai-provider.md](4-openai-provider.md) - second provider implementation
- [5-review-mode.md](5-review-mode.md) - ReviewController, diff rendering, accept and reject
- [6-testing-strategy.md](6-testing-strategy.md) - test outline for the new components
- [7-implementation-order.md](7-implementation-order.md) - build sequence and parallelisable steps
