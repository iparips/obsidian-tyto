# Findings

Production files only: tests and test-support are excluded. Counts are lines of
code, so comments and blanks do not inflate them.

## Over the file limit

| LOC | Functions | Longest function | File                               |
| --- | --------- | ---------------- | ---------------------------------- |
| 263 | 2         | 20               | engine/tools/tool-schemas.ts       |
| 179 | 22        | 20               | engine/prompting/prompt-builder.ts |
| 164 | 18        | 16               | engine/tool-dispatcher.ts          |

Close behind: panel-state.ts at 119, main.ts at 116, rule-builder.ts at 113.

Two files have since left this table. SessionPanel.tsx was at 127 and is now 94.
EditEngine was at 179 and is now 114.

## Long is not the same as complex

Two shapes hide in that table, and only one is a problem.

Data files are long because they hold data. tool-schemas.ts is 263 lines of
JSON schema declarations plus one filter; prompt-builder.ts is 22 small
functions assembling prose. Both read top to bottom, and splitting either would
separate content from the code that selects it.

Files with a long function are the ones to look at. A 20-line cap exists because
past it a reader holds too much at once, and that is true whether the file
around it is 100 lines or 300.

## Ranked by the worst single function

| Lines | Function                   | File                             |
| ----- | -------------------------- | -------------------------------- |
| 64    | PanelReducer.reduce        | session/models/panel-state.ts    |
| 51    | the SessionPanel component | session/views/SessionPanel.tsx   |
| 39    | RuleBuilder.searchRules    | engine/prompting/rule-builder.ts |
| 17    | EditEngine.runAgentLoop    | engine/edit-engine.ts            |

searchRules is a string array, not logic: it has one statement and no branches.
It is long the same way tool-schemas.ts is long, and needs nothing.

That leaves three.

## What the measurement missed

An automated scan counts lines between a signature and a closing brace, which
misreads two things in this codebase.

It reads a TypeScript interface as a function when a member is followed by a
paren, which is why SessionPanel.tsx first appeared to have a 47-line function
in its props declaration. Its real weight is 83 lines of hook wiring above the
JSX.

It counts a returned array literal as though every element were a statement,
which is what flags searchRules and most of prompt-builder.

Both are worth knowing before repeating the scan: the branch count matters more
than the line count.
