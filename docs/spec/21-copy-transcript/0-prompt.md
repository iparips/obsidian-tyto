---
created: 2026-09-11
updated: 2026-09-11
---

# Implementation Prompt

Paste this to a fresh agent to build the feature. Everything it needs is in this
folder; this says what to read, in what order, and what is easy to get wrong.

Implement the copy session transcript feature, specified in
docs/spec/21-copy-transcript/.

Read 1-index.md first, then 2-requirements.md, then 6-tasks.md. The tasks file
is the build order: four commits, each standing alone with its tests green.
Read 3a-document-shape.md before commit 1, 3b-wiring.md before commit 2, and
4-sample-output.md before commit 3, which is the format you are building.

The feature adds a Copy button beside Reset in the panel header. It writes the
whole session to the clipboard as Markdown: what the user saw, and what the
model was sent, nested the way the engine runs.

Four things the spec settles that are easy to get wrong:

1. The vocabulary is the engine's. A conversation turn is one utterance; a turn
   step is one pass of the loop, being one model call and the tool calls it
   returned. They are not the panel's numbered steps: one turn step returning
   three tool calls publishes three of those, so the two counts differ.

2. A recorded turn step stores ranges, not copies and not counts. The chat
   history is indexed into rather than duplicated, and the panel steps a turn
   step owns are an explicit first and last, closed when the next step is
   recorded. Session persistence is coming; a running counter would not survive
   being written down, which is why it is a range.

3. Prompt parts are deduplicated by text. A part is written once under a version
   and cited after that, so a session that loaded a skill partway keeps two
   system prompts rather than one per step.

4. The button is off by default, behind transcriptCopyEnabled in OwlSettings.
   With it off the button is absent, not disabled.

Repo conventions are in docs/AGENTS.md. Note in particular:

- Work on main and commit as you go. Do not create a branch or a worktree, and
  do not push.
- Load the code-generation skill before writing any class, and code-unit-tests
  before writing any test.
- Run `bun run test` as you go. `bun run build` reformats the whole repo, so if
  you run it, revert unrelated churn before handing back.

Two things to verify yourself rather than take from the spec, since both are
claims about code that may have moved:

- That ModelService records before the provider call, and that
  ConversationTurnRunner has exactly five return paths to record an ending on.
- That SessionBuilder can construct the store and pass it both to
  EngineFactory.build and to the panel props. The spec says EngineFactory builds
  SessionRepository internally and returns only an EditEngine, which is why the
  store cannot be built there.

The end-to-end check is a judgement the suite cannot make: copy a real failing
session, paste it into a note, and confirm the repeated steps read as repeats
and the appendix holds one copy of each prompt part.

If anything in the spec turns out to be wrong about the code, say so rather than
working around it, and update the spec with the code.
