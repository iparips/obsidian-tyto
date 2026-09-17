---
created: 2026-09-17
updated: 2026-09-17
---

# Context Budget

Estimated tokens are bytes of tool-result text divided by four, from the session
transcript. Partial reads count at the lines returned, not the file's length.
Excluded: the system prompt, tool schemas, always-on instruction files, and this
audit's prose.

## By Category

| Category   | Requirements | Note                                                      |
| ---------- | ------------ | --------------------------------------------------------- |
| skill      | 13,096       | Three skill bodies plus the sdd format files              |
| code       | 9,975        | Eighteen reads, half of them under 500 tokens             |
| navigation | 2,284        | Listings and the audit template                           |
| command    | 1,423        | Thirteen greps, the cheapest category per decision        |
| external   | 1,238        | Two Obsidian doc fetches and one search                   |
| state      | 218          | One git status                                            |
| total      | 28,234       |                                                           |

## By Impact

| Impact  | Requirements | Share |
| ------- | ------------ | ----- |
| high    | 14,142       | 50%   |
| medium  | 8,684        | 31%   |
| low     | 1,459        | 5%    |
| no      | 3,949        | 14%   |

The no-impact share is the audit's own tooling: the template and the two script
runs, one of which measured the wrong session.

## Most Expensive Reads

| Read                                  | Tokens | Impact | Verdict                                              |
| ------------------------------------- | ------ | ------ | ---------------------------------------------------- |
| text-generation SKILL.md              | 3,781  | medium | Mandatory before markdown. Fixed cost, no saving     |
| sdd SKILL.md                          | 2,884  | high   | Owns the file set and numbering. Earned it           |
| context_audit.py first run            | 1,947  | no     | Measured the wrong session. Avoidable, see below     |
| sdd format files, three in one read   | 1,743  | high   | Batched, which was right                             |
| turn-runner-factory.ts                | 1,715  | high   | Proved the turn is refused before any model call     |

## Blind Spots

- Skill bodies are measured on disk, not from the transcript, so their rows are
  approximate.
- Attachment records total 215,918 bytes and sit outside every table above. That
  is the instruction files and reminders, and it dwarfs the measured reads.
- The first script run pooled a different session's work, because the phase ran
  as a background job whose transcript sits apart from the project's newest
  file. The numbers here come from the corrected run.
- One transcript. The phase did not span sessions, so coverage is complete.
- Estimated reads are 28,234 against 165,708 fresh input tokens. Reads are a
  sixth of the input, so the prompt and the prose dominate.

## Recommendations

### Prompt Improvements

- Paste the error string, as this report did. It reached the failing line in one
  grep and skipped an engine-wide search, which is the single largest saving
  available on a bug of this shape.
- Name the Obsidian version in a bug report. The whole diagnosis turned on 1.7.2,
  and it was inferred from the API rather than given. One line would have gone
  straight to the deferred-view question.

### Reference Data Improvements

- Record the deferred-view constraint in docs/architecture/6-reaching-a-note.md.
  It governs every leaf read in the plugin and is currently written down nowhere,
  which is why three call sites share the same defect.
- Note in the same file that FakeWorkspace cannot represent a deferred leaf. A
  green suite over a broken workspace read is worth one sentence where a future
  reader will find it.

### Skills Refinements

- The sdd skill's preflight should say where a background job's transcript lives,
  or the audit step should resolve it. The wrong-session run cost 1,947 tokens
  and produced a table for unrelated work.
- The context-audit trigger fires on eight sources, and this phase cleared the
  bar only by counting web fetches. For a spec with no design doc the audit costs
  roughly a tenth of the phase. Worth a cheaper mode, or a higher bar for a bug
  spec.
