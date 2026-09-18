---
created: 2026-09-18
updated: 2026-09-18
---

# Context Budget

Estimated tokens are bytes of tool-result text divided by four, measured from this session's transcript rather than recalled. A partial read counts at the lines returned. Excluded: the system prompt, tool schemas, always-on instruction files and the agent's own output.

Categories are re-bucketed from the script's guesses. It classifies a `cat` of a markdown file as code, so the architecture docs and this spec's own files move to reference document by hand.

## By category

| Category           | Design | Note                                                              |
| ------------------ | ------ | ----------------------------------------------------------------- |
| code               | 21400  | Fifteen source files plus the obsidian typings                    |
| skill              | 16893  | Seven skill bodies and four sdd reference files                   |
| reference document | 8500   | Three architecture docs, the four spec files, one archived design |
| navigation         | 6288   | Listings of src/search, src/engine/tools, the prompt sections     |
| system of record   | 727    | git status, the line-number checks, the test run                  |
| total              | 53810  |                                                                   |

## By impact

| Impact          | Design | Share |
| --------------- | ------ | ----- |
| high            | 25610  | 48%   |
| medium          | 20515  | 38%   |
| low             | 1756   | 3%    |
| the audit itself | 4688  | 9%    |
| no              | 2845   | 5%    |
| total           | 53810  | 100%  |

Rounded from the script's per-row figures, and two rows are counted in two buckets, so the split sums a little above the total.

The audit row is this folder's own cost: the script, its template and the skill body. It is 9% of the phase, which a design that reached twenty-seven sources earns and a smaller phase would not.

The no-impact row is edit-verification churn. The python heredocs that rewrote the spec files came back as tool results and are counted, though they taught nothing.

## Most expensive reads

| Read                            | Tokens | Impact | Verdict                                                            |
| ------------------------------- | ------ | ------ | ------------------------------------------------------------------ |
| The four spec files, one cat    | 4808   | high   | Worth it. One call for the whole spec, which the prompt asked for  |
| sdd/SKILL.md                    | 3605   | medium | Worth it, though the workflow needed is one of five it carries     |
| tool-schemas.ts                 | 3182   | high   | Worth it. Three claims verified and two counts corrected           |
| text-generation/SKILL.md        | 3511   | medium | Worth it, and unavoidable: the post-write rule mandates it         |
| harness-tools-service.ts        | 1903   | high   | Worth it. The shortlist fallthrough is invisible from the schemas  |

## Blind spots

- Skill bodies are measured on disk rather than from the transcript, so their rows are an approximation of what actually entered context.
- Attachment records, which include skill bodies and system reminders, account for 236068 bytes that sit outside every table above.
- Sub-agent reads: none, so nothing is hidden there.
- Unattributed tool results: none.
- One transcript, covering one session. The requirements phase ran elsewhere and is not audited here, so the cross-phase view in the template's index has nothing to compare.

## Prompt improvements

- State that release-3-prompt.txt is the search-off fixture. The prompt asserted the opposite, which cost a read of system-prompt.test.ts and the prompt sections to disprove, about 1800 tokens, and would have shipped as a wrong instruction to the builder.
- Name the dispatcher's fallthrough. HarnessToolsService.execute ends by calling the shortlist, so a tool added without an explicit branch is silently dispatched as one. Finding that took a full read of the file.
- Drop the instruction to read 2-vocabulary.md unless the change names something new. This one renamed nothing, and the read cost 1756 tokens to confirm that.

## Reference data improvements

- 6-reaching-a-note.md should say that a tool returning paths is a write-permission question, in the section on the shortlist guard. The rule is there by implication and it is what settled D4; stating it would make the next such decision a lookup rather than a derivation.
- The requirements' In Scope line about re-recording the fixture was wrong and is corrected. A requirements phase that cannot check a claim against code should mark it as unverified rather than asserting it.
- src/search has no README and its package comment lives in the overview. A one-line note in note-glob.ts that search reads the vault rather than searching only content would have shortened D5.

## Skills refinements

- sdd/SKILL.md loads all five workflows for one. Splitting Write Design's steps into a reference file, as the formats already are, would save roughly 2500 tokens on any phase that needs one workflow.
- design-conventions.md mandates Feature flag and Gating sections with no escape hatch. This repo has neither, and the prompt had to say so explicitly. One line in the conventions saying a repo without gates drops both would remove that from every prompt.
- The context-audit script's category guesses are wrong for a docs-heavy repo: every markdown `cat` lands in code. A `--docs-glob` flag would remove the hand re-bucketing this audit needed.
