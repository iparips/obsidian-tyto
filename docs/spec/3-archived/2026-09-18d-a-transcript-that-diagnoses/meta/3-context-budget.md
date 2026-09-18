---
created: 2026-09-18
updated: 2026-09-18
---

# Context Budget

Metered from this session's transcript with the context-audit script, estimating tokens as bytes of tool-result text divided by four. Partial reads are counted at the lines returned, so a sed range costs what it printed rather than what the file holds. Excluded per [1-index.md](1-index.md).

## By Category

| Category         | Design | Note                                                                         |
| ---------------- | ------ | ---------------------------------------------------------------------------- |
| code             | 37,798 | 63 reads. The largest bucket, and where the phase's one correction came from |
| skill            | 23,342 | 12 reads, of which four were whole skill bodies                              |
| navigation       | 5,163  | 6 reads. Inflated by one listing bundled with a full file read               |
| command          | 853    | 5 reads                                                                      |
| system of record | 392    | 2 reads. Cheap, and one of them was the highest-value read of the phase      |
| other            | 214    | The one question put to the user                                             |
| total            | 67,762 | 90 reads                                                                     |

Reference documents are folded into code by the script, which classifies by path. The repo's own docs and spec files account for roughly 13,000 of the code row.

## By Impact

| Impact | Design | Share |
| ------ | ------ | ----- |
| high   | 21,400 | 32%   |
| medium | 24,100 | 36%   |
| low    | 15,800 | 23%   |
| none   | 6,400  | 9%    |

Two thirds of the spend changed the artefact. The low and no-impact third is mostly whole skill bodies read for one section each.

## The Most Expensive Single Reads

| Read                     | Tokens | Impact | Verdict                                                         |
| ------------------------ | ------ | ------ | --------------------------------------------------------------- |
| code-generation SKILL.md | 4,046  | medium | Two rules used out of a full body. A reference split would help |
| sdd SKILL.md             | 3,706  | medium | One workflow used out of five. Same shape                       |
| 3-decisions.md           | 3,587  | high   | Worth every token. Five decisions, three of them load-bearing   |
| text-generation SKILL.md | 3,511  | high   | Changed the deliverable's shape. Worth it, and fired late       |
| 2-requirements.md        | 3,412  | high   | The hub. Paid for itself despite carrying the wrong claim       |

## Blind Spots

Every gap the script reported, as a gap rather than an omission.

- Skill bodies are measured on disk rather than from the transcript, so the four whole-body rows are sized by the file and not by what the harness injected.
- Attachment records total 271,535 bytes and sit outside every table above. That is skill bodies, system reminders and pasted files.
- One transcript was read. The requirements phase ran in another session and is not covered, so no cross-phase comparison is possible.
- Estimated read tokens are 67,762 against 328,581 fresh input. The gap is prompt, tool schemas and prose, not reads.
- Sub-agent reads are zero, and none were spawned.
- The audit itself cost about 2,600 tokens: the skill body, the template, and two script runs. The first run metered the wrong session, which cost roughly 1,200 of that.

## Prompt Improvements

- Name the session transcript when a phase is audited. The script defaults to the most recent session in the project, which here was a different spec entirely, and the wrong run cost about 1,200 tokens before the mismatch was spotted.
- Say which endings write to the chat history when a spec's claim turns on an empty slice. The design prompt listed seven claims to verify and this was not one, yet it is the fact that falsified the central claim. One line would have replaced a five-hop chain and a throwaway test.
- Give the real call-site counts rather than a remembered total. The prompt said 149 sites; the count is 126 plus 11. The conclusion held, so the error cost only a recount, but the number was stated with more confidence than it had.

## Reference Data Improvements

- Add turn-outcomes.ts and turn-ending-service.ts to the requirements' Task references, as the pair that decides what reaches the history. Every future spec touching the transcript's slices needs them, and neither was listed.
- Record in 4-the-turn.md which of the six endings append to the chat history. It is a fact about the turn that three source files have to be read together to establish, and it is exactly the kind of boundary the architecture docs exist to hold.
- Drop the assumption bullets that a later phase has falsified rather than striking them through. The struck bullet in 3-decisions.md is kept deliberately as a record, but a reader scanning for current state reads two claims where one is true.

## Skills Refinements

- Split code-generation's SKILL.md so the naming rules and the blocks rules are separate references. The phase used two sections out of eleven and paid 4,046 tokens for the body. The same applies to sdd at 3,706 for one workflow.
- Make text-generation's file-length rule a preflight rather than a post-write check. Both deliverables were written over length and then split, which cost a rewrite of two files and their indexes. The rule is known before the first line is written.
- Have the context-audit skill's script name the session it picked and its last-modified time in the header. It prints the session id, which is not something a reader can match against the work in front of them without a directory listing.
