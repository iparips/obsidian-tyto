---
created: 2026-09-18
updated: 2026-09-18
---

# Context Budget

Metered from this session's transcript by the context-audit script, at bytes of tool-result text divided by four. A partial read counts the lines it returned, not the file. Excluded per [1-index.md](1-index.md): the system prompt, tool schemas, the two always-on instruction files, and this session's output. Impact ratings are the judgement of [2-design-context.md](2-design-context.md), not the script's.

## By category

| Category           | Design | Note                                                                          |
| ------------------ | ------ | ----------------------------------------------------------------------------- |
| code               | 36,412 | 37 reads. The largest single category, and the phase was a code-shape design  |
| skill              | 23,210 | 13 reads, five of them reference files the SKILL.md bodies pointed at         |
| command            | 5,291  | Writes, greps whose output was read, and the suite run                        |
| navigation         | 826    | One file search, for the describe block the prompt named                      |
| system of record   | 514    | Two git reads                                                                 |
| total              | 66,252 |                                                                               |

The architecture docs land in the code row. The script buckets a `cat docs/...` by its command pattern, and re-bucketing them would move roughly 5,180 tokens from code to reference document. Left as measured, with the correction stated here.

## By impact

| Impact | Design | Share |
| ------ | ------ | ----- |
| high   | 21,800 | 33%   |
| medium | 18,400 | 28%   |
| low    | 13,100 | 20%   |
| no     | 12,900 | 19%   |
| total  | 66,252 | 100%  |

The no-impact fifth is almost entirely skill bodies whose reference files carried the operative rules, plus the two whole-file reads noted below.

## Most expensive single reads

| Read                                   | Tokens | Impact | Verdict                                                                   |
| -------------------------------------- | ------ | ------ | ------------------------------------------------------------------------- |
| The four spec files, in one command    | 6,177  | high   | Right call. One read, and it carried every decision the design implements |
| src/engine/tool-dispatcher.ts, whole   | 4,762  | high   | Half-wasted. Two methods mattered; a sed of :190-:245 was 600 tokens      |
| skills/code-generation/SKILL.md        | 4,046  | medium | The typescript.md reference it points at did the deciding                 |
| skills/sdd/SKILL.md                    | 3,706  | high   | Unavoidable. It routes to every format file the phase needed              |
| skills/text-generation/SKILL.md        | 3,511  | high   | Paid for itself: it forced both file splits and cut a stale note          |
| src/session/views/SessionPanel.tsx     | 2,088  | high   | Right call. The branch order needed the whole component in view           |

## Blind spots

- Skill bodies are measured on disk rather than from the transcript, so their rows are an approximation of what the harness actually injected.
- Attachment records total 229,920 bytes and sit outside every table above. That is skill bodies, system reminders and pasted files, and it dwarfs the metered reads.
- Estimated read tokens of 66,252 against 249,251 fresh input means reads are roughly a quarter of what the phase consumed. The prompt, the tool schemas and this session's own prose are the rest.
- One transcript was read. The design phase ran in this session alone, so coverage is complete, but a later refresh needs `--all-sessions`.
- No sub-agent reads, and no unattributed tool results.
- The audit itself cost about 2,900 tokens across the skill body, its template, and two script runs. Worth it at 54 sources; it would not be at a handful.

## Prompt improvements

- Name the enum's consumers, not just the enum. The prompt said TurnEndingKind has five values and listed the files that record it, and the site that actually breaks is TranscriptTurnSection.answered, which no spec file mentions. A line saying "grep the enum and check every consumer" would have saved the four-hop chain, about 2,500 tokens, and it is the kind of miss that ships as a quiet transcript bug.
- Give line ranges for the big files. The prompt cited tool-dispatcher.ts:202 and :231 and the session read all 326 lines. A range in the citation saves about 4,100 tokens on that one file.
- Say whether a named test actually asserts what it is said to assert. The prompt said the answers-from-a-listing block asserts the current continue behaviour; it does not, and checking cost a targeted grep. One word, "believed", would have flagged it as a claim rather than a fact.

## Reference data improvements

- docs/architecture/2-vocabulary.md should name the file each table row is read from. Its endings table is the spec's source for "five endings", and the reader has to grep to learn that transcript-turn-section.ts also encodes the count. A file column would have put the missed site in front of the requirements phase.
- docs/architecture/4-the-turn.md describes the turn's return type in prose that this change falsifies. A pointer to conversation-turn-runner.ts:31 beside that table would make the staleness checkable rather than something a design phase discovers.

## Skills refinements

- The sdd skill's Write Design workflow should say the file-length check happens while authoring, not after. Both new files were written over 120 lines and then split, which cost a rewrite of the link graph. The unit-tests-format file says this for the test plan; design-conventions.md does not say it for the design.
- design-conventions.md mandates sections this repo has no use for: Feature flag, Gating, Logging, and the flag precedent search. The prompt had to disable all four by hand. A line in the conventions saying to drop them where the repo has no flag registry and no logging layer would remove that from every prompt this repo writes.
