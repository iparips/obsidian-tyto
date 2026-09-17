---
created: 2026-09-17
updated: 2026-09-17
---

# Context Budget

Estimated tokens are bytes of tool-result text divided by four, from the session
transcripts. Partial reads count at the lines returned, not the file's length.
Excluded: the system prompt, tool schemas, always-on instruction files, and this
audit's prose.

Two phases, one session each. The design column re-buckets the obsidian.d.ts
reads from code to external, which the script guesses by path.

## By Category

| Category   | Requirements | Design | Total  | Note                                                      |
| ---------- | ------------ | ------ | ------ | --------------------------------------------------------- |
| code       | 9,975        | 21,706 | 31,681 | The design read the call sites the requirements named      |
| skill      | 13,096       | 10,934 | 24,030 | Fixed cost per phase, and the largest single line item     |
| command    | 1,423        | 2,272  | 3,695  | Greps. Cheapest category per decision in both phases       |
| navigation | 2,284        | 828    | 3,112  | Listings and the audit template                            |
| external   | 1,238        | 844    | 2,082  | Obsidian's docs in one phase, its typings in the other     |
| state      | 218          | 4      | 222    | Two git status reads                                       |
| total      | 28,234       | 36,588 | 64,822 |                                                            |

Code and skill swap places between the phases. The requirements phase read the
error message and stopped; the design phase read eleven production files because
every one of them holds a site the change touches.

## By Impact

| Impact  | Requirements | Design | Total  | Share |
| ------- | ------------ | ------ | ------ | ----- |
| high    | 14,142       | 19,447 | 33,589 | 52%   |
| medium  | 8,684        | 9,021  | 17,705 | 27%   |
| low     | 4,014        | 1,459  | 5,473  | 8%    |
| no      | 3,949        | 4,104  | 8,053  | 12%   |

The design phase's no-impact share is this audit's own tooling and the mermaid
skill's unused sections. Its low-impact share is the two files read to confirm
they needed no change, which is a check that had to be run to be worth anything.

## Most Expensive Reads

| Read                                          | Tokens | Impact | Verdict                                              |
| --------------------------------------------- | ------ | ------ | ---------------------------------------------------- |
| 3-decisions.md with the AC and prompt          | 3,714  | high   | The five settled decisions. Unavoidable and earned   |
| sdd SKILL.md                                   | 2,884  | high   | Owns the file set and the numbering                  |
| Three sdd format files, batched                | 2,454  | high   | Batching was right. Separately it would have cost more |
| 1-index.md and 2-requirements.md, batched      | 2,216  | high   | The reading order the prompt set                     |
| transcript-turn-section.ts with fake-note-locator | 2,155 | high   | The unbounded slice and the signature ripple         |

Every one of the top five is high impact, which the requirements phase's table
could not say. A design phase that reads the prompt's named files first spends
its largest reads on the things it is there to decide.

## Blind Spots

- Skill bodies are measured on disk, not from the transcript, so those rows are
  approximate.
- Attachment records total 195,897 bytes in the design session, outside every
  table above. That is the instruction files and reminders, and it again dwarfs
  the measured reads.
- One transcript per phase. Neither phase spanned sessions, so coverage is
  complete, but the two runs cannot be pooled by the script and the columns above
  were combined by hand.
- The script buckets by command pattern, so a compound `cat A && cat B` lands in
  one category. Every row spanning two categories was re-bucketed from the
  command actually run, and the obsidian.d.ts correction is the only one that
  moved a total.
- Estimated design reads are 36,588 against 178,127 fresh input tokens. Reads are
  a fifth of the input, so prompt and prose still dominate.

## Recommendations

### Prompt Improvements

- The design prompt's five verifiable claims were worth their length. Four held
  and one had a wrong path, `turn-runner-factory.ts` rather than
  `turn/turn-runner-factory.ts`, which a grep corrected in seconds. Keep the
  pattern: naming a claim to check costs a line and saves a search.
- It did not name `OpenNote`'s nullable field as the thing D5 rests on, though it
  did name the constructor. One more line would have reached the type change
  without reading `note-edit-tool.ts` and `turn-repository.ts` to prove nothing
  else touches the editor, which was 2,041 tokens of confirmation.
- No prompt line pointed at the second branch of `notOpenMessage`, which is what
  produced D7. The general lesson is cheap to state: when a spec says a class
  loses its only caller, check whether the caller has one condition or two.

### Reference Data Improvements

- Both requirements-phase recommendations still stand and neither has been
  actioned: record the deferred-view constraint in
  docs/architecture/6-reaching-a-note.md, and note there that FakeWorkspace
  cannot represent a deferred leaf. The design phase re-derived both, at roughly
  1,900 tokens.
- `6-reaching-a-note.md` says a path becomes writable through an editor. The
  design bends that rule, so the file needs the vault-write exception written
  into it when the change lands, or the next reader designs around a constraint
  that is no longer true.

### Skills Refinements

- `design-conventions.md` mandates Feature flag and Gating sections with no way
  to say a repo has none. The prompt had to carry that instruction instead. One
  line in the conventions, saying a repo with no flags drops both sections and
  says so once, would move it from the prompt to the skill where it belongs.
- Its Logging section assumes levels and a table of them. This repo has
  `console.debug` and a prefix, so the shape was adapted by hand, again on the
  prompt's instruction. Worth one line allowing a repo's own logging shape.
- The context-audit trigger is unconditional after a design doc, which is right
  here: the design read 21 code sources and the audit cost roughly 4,100 tokens,
  a ninth of the phase. The requirements-phase complaint about the bar does not
  carry over.
