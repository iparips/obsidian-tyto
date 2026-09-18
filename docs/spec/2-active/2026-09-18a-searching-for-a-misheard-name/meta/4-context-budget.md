---
created: 2026-09-18
updated: 2026-09-18
---

# Context Budget

Metered from the session transcript rather than recalled, at bytes of tool-result text divided by four. A partial read is counted at the lines it returned, so a sed range costs what it printed. Excluded: the system prompt, the tool schemas, the two always-on CLAUDE.md files, and this agent's own output. Conventions are in [1-index.md](1-index.md).

## By category

| Category   | Design | Note                                                                 |
| ---------- | ------ | -------------------------------------------------------------------- |
| code       | 43,164 | 49 reads, the bulk of it verifying claims the spec made              |
| skill      | 22,681 | 12 files, measured on disk rather than from the transcript           |
| command    | 5,309  | 8 reads, mostly the test run and the two mermaid validations         |
| navigation | 3,285  | 4 listings, two of which found something no document named           |
| total      | 74,440 | 73 reads                                                             |

## By impact

| Impact | Design | Share |
| ------ | ------ | ----- |
| high   | 31,200 | 42%   |
| medium | 26,800 | 36%   |
| low    | 11,100 | 15%   |
| none   | 5,300  | 7%    |

Seventy-eight per cent of the budget went to reads that changed a decision or shaped the text. That is high, and the design prompt is why: it named six claims to verify, so most code reads had a question attached before the file was opened.

## The most expensive reads

| Read                          | Tokens | Impact | Verdict                                                             |
| ----------------------------- | ------ | ------ | ------------------------------------------------------------------- |
| Sibling design plus its ls    | 4,288  | high   | Worth it. Corrected two of the prompt's three claimed collisions    |
| spec 3-decisions.md           | 4,220  | high   | Unavoidable. Four resolved decisions the design implements          |
| code-generation SKILL.md      | 4,046  | high   | Worth it. Decided the NoteExcerpt split and the constructor rule    |
| spec 2-requirements.md        | 3,726  | high   | Unavoidable. Its References section found most of the code          |
| sdd SKILL.md                  | 3,706  | high   | Unavoidable, but two thirds of it is workflows this phase never ran |

## Blind spots

Every gap the script reported, stated as a gap rather than left out.

- Skill bodies are measured on disk, not from the transcript, so the 22,681 is their file size rather than what the harness actually injected. The real figure could differ either way.
- Attachment records total 256,643 bytes and sit outside every table above. That is the skill bodies as injected, the system reminders and the pasted spec content, and it is larger than everything the tables do count.
- Estimated read tokens of 74,440 against 307,538 fresh input means reads are under a quarter of what the session paid for. Prompt, schemas and prose dominate.
- One transcript was read. The phase ran in a single session, so coverage is complete, but a resumed phase would need a re-run with --all-sessions.
- No sub-agent reads and no unattributed results, so nothing is missing for those reasons.
- The audit itself cost about 2,400 tokens: the template, the script output twice, and the two mermaid validations. At 73 sources it earns that; a phase reaching a handful would not.

## Recommendations

### Prompt improvements

- Name the three files the sibling spec actually writes, not the three it cites. The prompt named search-report.ts and note-glob.ts, which the sibling only reads as precedent, and missed search-tools-service.ts and search-section.ts, which it writes. Verifying that cost 4,288 tokens and the prompt's own claim was the thing that had to be disproved.
- Say that search-report.test.ts has no ofGrep coverage. The design's test plan turns on it, and it was found by an ls rather than by any document. One line in the prompt removes a listing and the two reads that followed it.
- Drop the instruction to read 2-vocabulary.md and 5-asking-the-model.md unless prompt text moves between files. Both rated low: they confirmed usage that was already correct, at about 2,700 tokens. The trigger, not the file, is what the prompt should name.

### Reference data improvements

- Add turn-repository.ts to the requirements' References section, with the line that it distinguishes its turn-built repositories from its session-supplied ones. That fact decided D6, and finding it took a find across four filenames because the requirements named the two repositories without a path.
- Add a line to that same section saying the dispatcher publishes an answer through publishModelAnswerFn. The requirements point at HistoryEntry.tsx for the copyable block, which is the far end of the path; the near end is what a design needs and it took a grep to find.
- Record in the requirements that note-excerpt.ts has exactly one caller. It is what makes replacing the file safe rather than a change to an unchanged path, and it had to be established by reading both files.

### Skills refinements

- The sdd skill loads all four workflows to run one. Write Requirements, Write Implementation Prompt and Write PR Description were never used and cost roughly two thirds of its 3,706 tokens. Moving each workflow behind a reference file, with the triggers staying in SKILL.md, would cut that.
- The design-conventions file mandates Feature flag, Gating and Logging sections, plus a precedent search, and this repo has none of the three. The prompt had to say so explicitly. A line in the conventions file saying a repo with no flag registry and no logging layer drops all four would let the skill answer it instead of the prompt.
- The unit-tests format file says the plan breaks out past 120 lines but the design conventions do not mention the limit at all. The design was written as one 497-line file and then split, which cost a restructure. One line in design-conventions pointing at the text-generation limit would have had it written as a folder from the start.
