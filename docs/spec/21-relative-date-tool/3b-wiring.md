---
created: 2026-09-11
updated: 2026-09-11
---

# Classes and Wiring

The two new classes, how the tool is dispatched, and the prompt rule that makes
the model reach for it.

## Where it lives

ResolvedDate (Model, new) is the value: the phrase, the date, its weekday, its
ISO week and that week's Monday. It formats itself into the sentence the model
reads, so no caller assembles that text.

RelativeDateResolver (Model, new) sits beside Today (Model) and owns both
libraries. It takes a phrase and the instant Today holds, calls chrono with
that instant as the reference date, and returns a ResolvedDate or the reason it
could not. Nothing else in the codebase imports chrono.

Passing Today's instant rather than letting chrono default to the wall clock is
what keeps the tool and the date line agreeing. A test fixes the instant and
gets a fixed answer.

DateToolService (Engine Tools, new) is the harness side: it reads the phrase
off the ToolCall, asks RelativeDateResolver, and returns a TextResult carrying
the sentence and the turn step, or a Refusal. It matches SearchToolsService
(Engine Tools) in shape, which is the placement test for tools/: it takes a
ToolCall and returns a result.

HarnessToolsService (Engine Tools) dispatches to it, beside glob and grep. The
tool reaches no vault, but it answers the same question a glob does, so it
refuses with the rest when search is off rather than being a second exception.

ToolCall (Model Providers) gains isResolveDate, and isHarnessTool must return
true for it. ToolDispatcher routes on that predicate, so a tool absent from it
falls through to the edit tools: the call is in the schemas, the service can
run it, and it still fails at runtime. Nothing fails to compile, which is why
it is stated here.

The result is a TextResult or a Refusal, both of which already exist. No new
HarnessResultKind, so the dispatcher's exhaustive switch is untouched.

## The rule that makes it load-bearing

SearchSection (Model Prompt) gains one bullet under Globbing, beside the one
forbidding an unseen date:

- Never work out a date yourself. When the user names a day in words rather
  than as a date, send their words to resolve_date and glob on the date it
  returns.

The existing unseen-date bullet already covers what happens after: a glob
matches the format a listing showed, or it is wrong. The new bullet only names
where the date comes from.

One bullet, not two. A parser that matches ordinary usage needs no second rule
telling the model when to distrust it, which is the prompt cost a decomposed
interface would have carried.

## What does not change

- The date line in DateMessage. It still states today, because a model that
  knows what today is sends better phrases to the tool.
- The bullet forbidding a question about which week a date falls in. The tool
  answers that question, so the rule stands unqualified.
- Today itself. Its week logic is correct and shipped, and moving it onto
  date-fns is worth doing on its own.
