# Desktop MVP: Testing Strategy

Vitest with happy-dom; obsidian aliased to the test-support mock. Tests follow the unit test rules: one branch per test case, "does X when Y" naming, Arrange-Act-Assert, builders in src/test-support/.

## Test Outline

### NoteEditor (engine/note-editor.test.ts)

- applies replacement when the anchor matches exactly once
- returns noMatch when the anchor is absent
- returns multipleMatches when the anchor appears twice
- inserts before the anchor when position is before
- inserts after the anchor when position is after
- inserts at note start when location is noteStart
- inserts at note end when location is noteEnd
- inserts at the captured cursor when location is cursor
- preserves surrounding content when applying in the middle of a line

### EditEngine (engine/edit-engine.test.ts)

- returns the text as summary when the model responds without tool calls
- applies operations in order when a turn has multiple tool calls
- sends the failure reason as tool result when apply returns noMatch
- sends invalid-arguments as tool result when args fail validation
- continues the loop when tool results are followed by more tool calls
- fails with a chat-step outcome when the iteration cap is reached
- queues a second utterance when a turn is in flight
- re-reads note content when a new turn starts

### MistralProvider (providers/mistral-provider.test.ts)

- returns transcript text when the transcription request succeeds
- returns a transcription-step failure when the API responds non-2xx
- maps tool_calls to ChatTurn toolCalls when the chat response contains them
- maps content to ChatTurn text when the chat response is plain
- returns a chat-step failure when the chat request rejects

### SessionPanel (session/SessionPanel.test.tsx)

- transitions to recording when the mic button is clicked in idle
- transitions to transcribing when the mic is clicked while recording
- returns to idle when cancel is clicked while recording
- renders a user entry when the transcript arrives
- renders an assistant entry when the turn summary arrives
- renders an error entry naming the step when an outcome fails
- disables the send button while a turn is thinking
- submits typed text when send is clicked in idle

### Recorder (capture/recorder.test.ts)

- resolves with blob and mime type when stop is called
- returns a transcription-step failure when mic permission is denied
- discards the recording when cancel is called

### SkillRepository (skills/skill-repository.test.ts)

- builds a catalogue holding every skill when the directory has several
- returns an empty catalogue when the skills directory is missing
- skips a skill file when its frontmatter has no name
- keeps valid siblings when one skill file is malformed
- parses a description written as a folded scalar across several lines
- reads the configured path when settings override the default

### Skills in the prompt (engine/tool-schemas.test.ts)

- lists one line per skill when the catalogue has entries
- omits the skills section when the catalogue is empty
- states the single-note rule when the catalogue has entries

## Out of Scope

- No end-to-end tests against live APIs; provider tests mock fetch at module level.
- The MVP exit test (example instructions on a real note) is manual, run against a dev vault.
- FR37 refusal of a cross-file skill is model behaviour, so tests assert the prompt carries the rule and the tool list stays single-note. Whether the model obeys is checked in the manual exit test.
