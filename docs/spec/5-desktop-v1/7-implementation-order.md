# Desktop V1: Implementation Order

1. Contracts: realtime types, RealtimeAuth, widened settings ([2-data-model.md](2-data-model.md)).
2. (A) Mistral realtime session and DirectKeyAuth, behind the new contracts.
3. (A) Downsampler and StreamingTranscriber with mocked session.
4. (A) OpenAIProvider: batch, chat, realtime; contract suite green for both providers.
5. (A) ReviewController with tests.
6. SessionPanel: live partials, diff cards, pending-review state.
7. SettingsPanel: provider dropdown, keys, language, microphone, review toggle.
8. Frontmatter language override in session binding.
9. Manual exit test and latency spot check.

Steps 2-5 are independent once step 1 lands; they touch disjoint files and share only the contracts.
