---
created: 2026-09-10
updated: 2026-09-10
---

# Sample Output

What Copy writes for the session in the requirements: one conversation turn,
twenty turn steps, eleven of them the same glob, ending on the step cap.
Abridged at the marked points.

The document nests the way the engine runs. A conversation turn is one
utterance, holding the turn steps it spent, and each step carries three blocks
in the order the loop runs them:

- Request to model: the prompt parts cited by version, then what is new in the
  conversation since the step before.
- Response from model: the tool calls it asked for, or the text that ends the
  turn.
- Harness: what running those tool calls did, as the panel showed it.

A step's Harness block is what the next step's Request carries as a tool result,
so the three blocks chain. Setup holds the harness work before the first model
call: TurnRunnerFactory resolves the note, collects its AGENTS.md chain and
lists skills, and only the chain narrates itself, so one panel step lands there.
Every Harness block ends on an Outcome line, because the harness is what decides
whether the turn goes on: it spends the step budget, watches for the same
refusal twice, reads a text response as the reply, and catches a provider
failure or a cancel. The model never ends a turn. Most steps say continue; the
one that ends the turn names the ending and carries the message the user got.

Lines in square brackets are this sample's abridgement markers. The real
transcript writes every step in full. Prompt parts go to the appendix and are cited by
version, which is what keeps a repeated step to a few lines. The settings sit in
the metadata because they decide which sections the system prompt carries. The
API key is never written.

````markdown
# Owl session transcript

## Session metadata

| Field    | Value                                   |
|----------|-----------------------------------------|
| Copied   | 2026-09-10 15:25                        |
| Plugin   | Owl 0.1.0                               |
| Note     | 1 - Journal/Weekly/Week-37/09-09-Wed.md  |
| Model    | mistral-medium-latest                   |
| Search   | enabled                                 |
| Open     | confirm                                 |
| Skills   | 0 - Meta/Skills                         |
| Commands | daily-notes:*                           |
| Turns    | 1 conversation turn, 20 turn steps      |

## Conversation turn 1

Utterance: Find a note from last week's Saturday and on top write that it was a
great day.

### Setup

- Loaded agent instructions - vault root

### Turn step 1

Request to model
- system prompt v1, date v1, note context v1
- user: Find a note from last week's Saturday and on top write that it was a
  great day.

Response from model
- tool call glob {"pattern": "**/*30*Sat.md"}

Harness
- Globbed - **/*30*Sat.md - 1 note
- Result: 1 - Journal/Weekly/Week-35/08-30-Sat.md
- Outcome: continue

### Turn step 2

Request to model
- system prompt v1, date v1, note context v1
- tool result: 1 - Journal/Weekly/Week-35/08-30-Sat.md

Response from model
- tool call glob {"pattern": "**/*30-08-Sat.md"}

Harness
- Globbed - **/*30-08-Sat.md - nothing matched
- Outcome: continue

[abridged: steps 3 to 5 glob 06-09-Sat.md twice and list Week-36. Step 5
returns two tool calls, so its Harness block holds two panel steps]

### Turn step 6

Request to model
- system prompt v1, date v1, note context v1
- tool result: 10 notes in 1 - Journal/Weekly/Week-36

Response from model
- tool call load_skill {"name": "journal"}

Harness
- Loaded skill - journal
- Result: journal skill, 340 words
- Outcome: continue

### Turn step 8

Request to model
- system prompt v2, date v1, note context v1
- tool result: 1 - Journal/Weekly/Week-36/09-06-Sun.md

Response from model
- tool call glob {"pattern": "**/Week-36/09-06-Sat.md"}

Harness
- Globbed - **/Week-36/09-06-Sat.md - nothing matched
- Outcome: continue

[abridged: step 7 globs 09-06-Sun.md and is the first to cite v2. Steps 9 to 19
repeat step 8 exactly: same request lines, same pattern, same nothing matched]

### Turn step 20

Request to model
- system prompt v2, date v1, note context v1
- tool result: nothing matched

Response from model
- tool call glob {"pattern": "**/Week-36/09-06-Sat.md"}

Harness
- Globbed - **/Week-36/09-06-Sat.md - nothing matched
- Warned - Owl is taking longer than usual: 3 steps left this turn
- Outcome: exhausted - Owl ran out of steps for this turn after 20. The steps
  list shows where they went. Try a smaller instruction, or say which note to
  use.

## Appendix: prompt parts

Each part is written once here and cited by version from the turn steps above.

### System prompt v1

```text
You are Owl, an assistant that edits the note the user has open.
[full assembled text, as SystemPrompt built it]
```

### System prompt v2

Differs from v1 by the journal skill, loaded in step 7.

```text
[unchanged through the search section, then:]

## Skills
- journal: how this vault names and files its daily notes
```

### Date message v1

```text
Today is 2026-09-09 (Wednesday), in week 37, which began Monday 2026-09-07.
Resolve every relative date in the instruction against it, never against
a date in the conversation or a note name. A note named for a date is not
evidence of what today is.
```

### Note context v1

```text
Note path: 1 - Journal/Weekly/Week-37/09-09-Wed.md
Cursor line: 0
This is the note as it is right now, re-read from the editor. It supersedes any
earlier copy or description in this conversation, including your own. The user may
have edited it since the last turn. Never answer from an earlier copy.
Note content, fenced as markdown:
# Wednesday
```
````

## What the nesting buys

Both faults are one read apart, because a step's Harness block sits beside the
Request that carried it forward:

- Step 1's Harness returned 08-30-Sat.md. Step 2's Request carries that result,
  and its Response asks for 30-08-Sat.md. The model had the vault's format in
  front of it and reordered it.
- Steps 8 to 20 are identical line for line. Same cited parts, same tool result,
  same pattern, same nothing matched. A loop reads as a loop only when the
  inputs sit beside the output at each step.

The panel shows the flat list, and the reported session could not be diagnosed
from it.
