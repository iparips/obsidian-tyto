# Manual Test Scenarios

Scenarios that catch the faults this vault has actually hit, each written to be
run by hand and later automated. Every one comes from a real failure rather than
from a requirement, so a passing run means the system does not regress to
something it has already done.

Each scenario states the setup, the steps, and what to check. The check is what
an automated evaluation would assert, so it names an observable rather than a
feeling: a step in the panel, a line in the note, a refusal the model reads.

- [2-choosing-and-opening.md](2-choosing-and-opening.md) - the pick, the open, and the edits that must not land
- [3-skills-and-instructions.md](3-skills-and-instructions.md) - loading the right skill, once, before the write
- [4-finding-notes.md](4-finding-notes.md) - globbing for a note rather than guessing at folders
- [5-session-and-recovery.md](5-session-and-recovery.md) - what a session binds to, and what survives a failure
- [6-panel-and-settings.md](6-panel-and-settings.md) - the steps list, the picker, and the allow-list

## How to run these

Run them against a real vault on both surfaces, desktop and the mobile drawer.
The panel's steps list is the primary evidence: most checks below name a step,
its label, or its position in the numbered list.

Press Reset between scenarios. A session carries its binding and its chat
history across turns, and several faults below were only visible because an
earlier turn had left something behind.

## What automation would need

Three things the current test suite does not have.

A scripted model, so a scenario can assert what the harness does with a given
sequence of tool calls rather than what a live model chooses to call. Most
scenarios below split into a harness half that is deterministic and a judgement
half that is not.

A vault fixture, so paths like the archived Week-32 folder exist and a scenario
does not depend on one person's notes.

A record of the prompt each turn sent, since several faults were prompt
ordering rather than logic and are invisible from the outside.

## What stays manual

Judgement cases. Whether the model picks the right skill, widens a failed glob
rather than reordering it, or writes under an existing heading are all model
choices. An evaluation can measure how often they go the right way; it cannot
assert them on a single run.
