---
created: 2026-09-17
updated: 2026-09-18
---

# Multi-Note Editing: Spec

One utterance naming a shopping list, a todo and today's daily note writes to none of them. Found on mistral-medium-latest against a real vault, with two transcripts: the first ran out of steps, the second ended stuck after the two smaller faults were fixed.

The loop can already edit several notes in a turn: reach a note, edit it, reach the next. What is missing is the guarantee that a step's target holds still. The note is read once at the start of a step, but a command or an open moves the target mid-step. Three notes opened in one step therefore leave every edit anchored to whichever opened last.

The work is one rule: refuse a second retargeting call in a step, as a second edit is already refused. A prompt line asking the model to reach one note before the next sits beside it, and is tuning rather than the fix.

- [0-prompt-design.md](0-prompt-design.md) - hands the design phase to a fresh session: what is settled, what to verify, and where D4 has teeth
- [2-requirements.md](2-requirements.md) - the once-per-step read, the two tools that move the target, and steps to replicate
- [3-decisions.md](3-decisions.md) - why the rule covers every retargeting call, why a step cannot both reach and edit, and what the fix assumes about the model
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - six manual checks, since whether the model interleaves is a judgement no unit test makes

D1, D2 and D4 are resolved, so the design can start. D3 is open and about step accounting, which is wrong before it is expensive.

On main already: 79e505c says an empty note read back empty, a777c0b names the anchor and the note an edit failed on. Neither is the cause, and the second transcript fails with both in place.
