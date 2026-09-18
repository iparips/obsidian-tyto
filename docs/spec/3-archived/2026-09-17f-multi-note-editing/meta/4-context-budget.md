---
created: 2026-09-18
updated: 2026-09-18
---

# Context Budget

Metered from the session transcript by the context-audit script: bytes of tool-result text divided by four. A partial read is counted at the lines returned, not at the file's size. Excluded: the system prompt, tool schemas, the two always-on instruction files, and this audit's own output.

Categories are corrected from the script's guesses. It buckets a whole compound command by its first pattern, so the combined cat of the spec files landed in code and the ls of the test folders landed partly in navigation.

## By category

| Category           | Design | Note                                                           |
| ------------------ | ------ | -------------------------------------------------------------- |
| code               | 25,900 | 30 reads, all of obsidian-tyto src, including four test files  |
| skill              | 14,400 | 9 files: sdd and its four references, text-generation, mermaid |
| reference document | 6,700  | The spec folder and three architecture docs                    |
| navigation         | 3,700  | Three listings, one of which found all three test files        |
| system of record   | 600    | Two suite runs and a git status                                |
| total              | 51,300 |                                                                |

## By impact

| Impact        | Design | Share |
| ------------- | ------ | ----- |
| high impact   | 12,900 | 25%   |
| medium impact | 21,400 | 42%   |
| low impact    | 11,600 | 23%   |
| no impact     | 5,400  | 10%   |
| not read      | 0      | 0%    |

## Most expensive reads

| Read                                        | Tokens | Impact | Verdict                                                             |
| ------------------------------------------- | ------ | ------ | ------------------------------------------------------------------- |
| text-generation SKILL.md                    | 3,511  | medium | Mandatory per the user's post-write rule; shaped prose, not content |
| sdd SKILL.md                                | 2,884  | high   | Earned it. Named the four references and the artefact numbering     |
| ls of test folders plus builders.ts         | 2,423  | medium | One command that found all three target test files and the wiring   |
| combined cat of spec index and requirements | 2,196  | high   | The scope and the rule, in one read                                 |
| mermaid SKILL.md                            | 2,080  | medium | Caught two modelling errors in a diagram already written            |

## Blind spots

- Skill bodies are measured on disk rather than from the transcript, so their byte counts are the file sizes and not what the harness injected. Four rows are affected.
- Attachment records total 236,133 bytes and sit outside every table. They hold the skill bodies as injected, the system reminders, and the two always-on instruction files.
- Estimated read tokens of 51,300 against fresh input of 273,298 means prompt, schemas and prose dominate the session rather than reads. The tables account for under a fifth of fresh input.
- One session, no compaction. The phase ran start to finish in this session, so coverage is complete.
- The audit itself cost about 1,400 tokens for the template and the script output, on a phase that reached 36 sources. That ratio earns it.

## Prompt improvements

- Name session-repository.ts as a file to read, not just turnRepository.targetNote() as a thing to verify. The prompt said the target is readable between calls and named the turn repository; the session repository is where the answer actually was, and finding it took three hops. About 2,000 tokens, and it is the phase's one real design decision.
- Say which test files hold the command and open_note cases. The prompt named edit-engine.test.ts only, and the other two were found by listing a directory. About 2,400 tokens.
- Drop the instruction to read 1-index.md first. It restates the requirements, and the prompt already carried the framing. About 400 tokens.

## Reference data improvements

- Add a line to 6-reaching-a-note.md saying the session binds before the turn resolves, and that the two targets disagree when a path will not resolve. It is the architecture's own fact, it is not written down anywhere, and not knowing it is how a guard gets built on the wrong read.
- Put the test-file map in the repo's CLAUDE.md under Tests: which engine test file drives commands, which drives open_note, which drives edits. Three lines that replace a directory listing and a file read in every future engine phase.
- Correct D4's body in 3-decisions.md if it is ever cited alone. It names turnRepository.targetNote() as the read, and D5 supersedes that. Done in this phase; noting it so a future reader of the archived spec does not re-derive the contradiction.

## Skills refinements

- The sdd skill's Write Design step 1 tells every phase to preflight a rollout flag, then ends with "a repo with no feature gates skips this step". Repos with no flags pay for reading the precedent-search section of design-conventions.md anyway. Moving the flag material behind a reference file would save about 400 tokens per design phase in this repo.
- The mermaid skill was loaded after the diagram was drawn, because the design-conventions file mentions it at the point the diagram is specified rather than at the top. Loading it first would have avoided rewriting the sequence diagram's arrows and labels. Cost this phase: one rewrite of a 30-line block.
