---
created: 2026-09-11
updated: 2026-09-11
---

# Tasks

Three commits. The first two land a tool nothing calls yet; the third is what
changes the model's behaviour.

## Commit 1: RelativeDateResolver turns a phrase into a date

chrono-node and date-fns join the runtime dependencies, and two new classes sit
beside Today (Model).

- ResolvedDate holds the phrase, date, weekday, ISO week and week start, and
  formats the sentence the model reads
- RelativeDateResolver takes a phrase and an instant, calls chrono with that
  instant as the reference date, and returns a ResolvedDate or a reason
- It refuses on no result, on more than one, and on a result knowing a month
  but no day or weekday
- chrono is imported here and nowhere else
- Today is untouched, so nothing already shipped moves

Tests fix the instant, so no case reads a clock. They cover the phrases from
the reported turn, the Saturday reading, a January ISO week, and one refusal
per detection route.

## Commit 2: the tool is offered and dispatched

DateToolService (Engine Tools, new), the schema, and the wiring.

- resolve_date in TOOL_SCHEMAS, one required string argument, described as the
  user's own words rather than a date
- RESOLVE_DATE in tool-call.ts, with an isResolveDate predicate beside the rest
- ToolCall.isHarnessTool returns true for it, or the dispatcher falls through
  to the edit tools and the call fails at runtime while looking wired
- ToolCatalogue.isOffered puts it with the search tools, so search off hides it
- HarnessToolsService dispatches to DateToolService beside glob and grep
- TurnStep.resolved, so the panel shows the phrase and the date it became

The isHarnessTool line is the one a wiring change forgets. TOOL_SCHEMAS and
HarnessToolsService can both be right while the dispatcher never routes the
call, and nothing fails to compile.

The catalogue tests in src/engine/tests assert what a vault is offered, and a
new case belongs there. The release 3 fixture is prompt text and does not list
tools, so it cannot catch a tool leaking into the no-search list.

## Commit 3: the glob rules send the model to the tool

One bullet in SearchSection (Model Prompt), under Globbing.

- Never work out a date yourself; send the user's words to resolve_date and
  glob on the date it returns
- The unseen-date bullet, the which-week bullet and the date line are untouched

Prompt text only, so the tests asserting those bullets are the only ones
affected. This is the commit that changes behaviour, and the two before it are
inert without it.

## After the commits

The end-to-end case is a model outcome and belongs in docs/manual-tests. On a
Friday, say "find a daily note from last Friday and write, I ate eggs on toast
on top of the note", and confirm the turn sends the phrase to resolve_date,
globs once on what came back, and offers the previous week's Friday note.

Two phrases are worth trying beside it: "a fortnight ago", which does not parse
and should reach the user as a question, and "last Friday" spoken on a
Saturday, which resolves to the Friday just gone.
